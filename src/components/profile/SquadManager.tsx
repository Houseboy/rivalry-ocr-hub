import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Upload, Trash2, Star, Image as ImageIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Squad {
  id: string;
  squad_name: string;
  platform: string;
  image_url: string;
  is_primary: boolean;
  created_at: string;
}

interface SquadManagerProps {
  userId: string;
  squads: Squad[];
  onSquadsUpdate: () => void;
}

export const SquadManager = ({ userId, squads, onSquadsUpdate }: SquadManagerProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [squadName, setSquadName] = useState("");
  const [platform, setPlatform] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUpload = async () => {
    // Validate required fields
    if (!selectedFile || !squadName.trim() || !platform) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields and select an image",
        variant: "destructive",
      });
      return;
    }

    // Validate platform value (must match database CHECK constraint)
    const validPlatforms = ['FIFA', 'eFootball'];
    if (!validPlatforms.includes(platform)) {
      toast({
        title: "Invalid platform",
        description: "Please select either FIFA or eFootball",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      // Upload image to storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('squad-images')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('squad-images')
        .getPublicUrl(fileName);

      // Prepare squad data with proper types
      const squadData = {
        user_id: userId,
        squad_name: squadName.trim(),
        platform: platform as 'FIFA' | 'eFootball',
        image_url: publicUrl,
        is_primary: squads.length === 0, // First squad is primary
      };

      // Insert squad record
      const { error: insertError } = await supabase
        .from('squads')
        .insert(squadData);

      if (insertError) throw insertError;

      toast({
        title: "Squad uploaded!",
        description: "Your squad has been saved successfully.",
      });

      // Reset form
      setSquadName("");
      setPlatform("");
      setSelectedFile(null);
      setPreviewUrl("");
      setIsDialogOpen(false);
      onSquadsUpdate();
    } catch (error: any) {
      console.error('Upload error:', error);
      let errorMessage = 'Failed to upload squad. Please try again.';
      
      // Handle specific constraint violation
      if (error.message?.includes('violates check constraint')) {
        errorMessage = 'Invalid platform selected. Please choose a valid platform from the list.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Upload failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (squadId: string, imageUrl: string) => {
    try {
      // Extract file path from URL
      const url = new URL(imageUrl);
      const pathParts = url.pathname.split('/');
      const filePath = pathParts.slice(pathParts.indexOf('squad-images') + 1).join('/');

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('squad-images')
        .remove([filePath]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('squads')
        .delete()
        .eq('id', squadId);

      if (dbError) throw dbError;

      toast({
        title: "Squad deleted",
        description: "Your squad has been removed.",
      });

      onSquadsUpdate();
    } catch (error: any) {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSetPrimary = async (squadId: string) => {
    try {
      // Reset all squads to non-primary
      await supabase
        .from('squads')
        .update({ is_primary: false })
        .eq('user_id', userId);

      // Set selected squad as primary
      const { error } = await supabase
        .from('squads')
        .update({ is_primary: true })
        .eq('id', squadId);

      if (error) throw error;

      toast({
        title: "Primary squad updated",
        description: "Your primary squad has been set.",
      });

      onSquadsUpdate();
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex flex-col space-y-2 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-xl font-semibold">My Squads</CardTitle>
            <CardDescription className="text-muted-foreground">
              Upload and manage your preferred game squads
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 mt-2 sm:mt-0 w-full sm:w-auto">
                <Upload className="w-4 h-4" />
                Upload Squad
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-lg font-semibold">Upload New Squad</DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Add a new squad to your profile. Upload an image and fill in the details.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-5 py-4">
                <div className="space-y-2">
                  <Label htmlFor="squadName" className="text-sm font-medium">Squad Name</Label>
                  <Input
                    id="squadName"
                    value={squadName}
                    onChange={(e) => setSquadName(e.target.value)}
                    placeholder="Enter squad name"
                    className="h-10"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="platform" className="text-sm font-medium">Platform</Label>
                  <Select value={platform} onValueChange={setPlatform}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Select platform" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FIFA">FIFA</SelectItem>
                      <SelectItem value="eFootball">eFootball</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Squad Image</Label>
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/30 hover:bg-muted/50 transition-colors border-muted-foreground/20">
                      <div className="flex flex-col items-center justify-center p-4 text-center">
                        <Upload className="w-5 h-5 mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground mb-1">
                          <span className="font-medium">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-muted-foreground">PNG, JPG (MAX. 5MB)</p>
                      </div>
                      <input
                        id="dropzone-file"
                        type="file"
                        className="hidden"
                        onChange={handleFileSelect}
                        accept="image/*"
                      />
                    </label>
                  </div>
                  {previewUrl && (
                    <div className="mt-3 rounded-md overflow-hidden border">
                      <img
                        src={previewUrl}
                        alt="Squad preview"
                        className="w-full h-40 object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleUpload} 
                  disabled={isUploading}
                  className="w-full sm:w-auto"
                >
                  {isUploading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Uploading...
                    </span>
                  ) : 'Upload Squad'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {squads.length === 0 ? (
          <div className="text-center py-12 space-y-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <ImageIcon className="w-8 h-8 text-muted-foreground" />
              </div>
            </div>
            <div>
              <p className="text-muted-foreground">No squads uploaded yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Upload your first squad to get started
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-6">
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {squads.map((squad) => (
                    <Card key={squad.id} className="relative overflow-hidden group border border-muted-foreground/20 hover:border-muted-foreground/40 transition-colors">
                      <div className="relative aspect-video overflow-hidden bg-muted/30">
                        <img
                          src={squad.image_url || '/placeholder.svg'}
                          alt={squad.squad_name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        
                        {/* Hover overlay with actions */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                          <Button
                            variant={squad.is_primary ? 'default' : 'outline'}
                            size="sm"
                            className={`rounded-full ${squad.is_primary ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-background/80 backdrop-blur-sm'}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSetPrimary(squad.id);
                            }}
                          >
                            <Star className={`w-4 h-4 mr-1.5 ${squad.is_primary ? 'fill-white' : 'text-muted-foreground'}`} />
                            {squad.is_primary ? 'Primary' : 'Set Primary'}
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="rounded-full bg-destructive/90 hover:bg-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm('Are you sure you want to delete this squad?')) {
                                handleDelete(squad.id, squad.image_url);
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4 mr-1.5" />
                            Delete
                          </Button>
                        </div>
                        
                        {/* Primary badge */}
                        {squad.is_primary && (
                          <Badge className="absolute top-3 left-3 bg-yellow-500/90 hover:bg-yellow-500 text-white border-none shadow-md">
                            <Star className="w-3.5 h-3.5 mr-1.5 fill-white" />
                            Primary
                          </Badge>
                        )}
                      </div>
                      
                      {/* Squad info */}
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium text-foreground">{squad.squad_name}</h3>
                            <div className="flex items-center mt-1">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground capitalize">
                                {squad.platform}
                              </span>
                              <span className="text-xs text-muted-foreground ml-2">
                                {new Date(squad.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};