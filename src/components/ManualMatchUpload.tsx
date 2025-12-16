import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, X, Camera } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ManualMatchUploadProps {
  onMatchSaved: () => void;
  onClose: () => void;
}

export default function ManualMatchUpload({ onMatchSaved, onClose }: ManualMatchUploadProps) {
  const [userScore, setUserScore] = useState('');
  const [rivalScore, setRivalScore] = useState('');
  const [rivalName, setRivalName] = useState('');
  const [comment, setComment] = useState('');
  const [platform, setPlatform] = useState('');
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload a valid image file (JPG, PNG, GIF, or WebP)');
      return;
    }

    setScreenshotFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const removeScreenshot = () => {
    setScreenshotFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    if (!userScore || !rivalScore || !rivalName || !platform) {
      alert('Please fill in all required fields');
      return;
    }

    setIsUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      let screenshotUrl = '';
      
      if (screenshotFile) {
        console.log('Uploading screenshot:', screenshotFile.name);
        const fileExt = screenshotFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        console.log('File path:', fileName);
        
        const { error: uploadError } = await supabase.storage
          .from('match-screenshots')
          .upload(fileName, screenshotFile);

        if (uploadError) {
          console.error('Storage upload error:', uploadError);
          throw new Error(`Storage upload failed: ${uploadError.message}`);
        }

        const { data: { publicUrl } } = supabase.storage
          .from('match-screenshots')
          .getPublicUrl(fileName);

        console.log('Public URL:', publicUrl);
        screenshotUrl = publicUrl;
      }

      const matchData = {
        user_id: user.id,
        user_score: parseInt(userScore),
        rival_score: parseInt(rivalScore),
        rival_name: rivalName,
        screenshot_url: screenshotUrl,
        platform: platform,
        match_date: new Date().toISOString(),
        result: parseInt(userScore) > parseInt(rivalScore) ? 'win' : 'loss'
      };

      console.log('Match data to insert:', matchData);

      const { error: insertError } = await supabase
        .from('matches')
        .insert(matchData);

      if (insertError) {
        console.error('Database insert error:', insertError);
        throw new Error(`Database insert failed: ${insertError.message}`);
      }

      onMatchSaved();
      onClose();
      resetForm();
    } catch (error) {
      console.error('Error saving match:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Error saving match: ${errorMessage}`);
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setUserScore('');
    setRivalScore('');
    setRivalName('');
    setComment('');
    setPlatform('');
    removeScreenshot();
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="userScore">Your Score *</Label>
          <Input
            id="userScore"
            type="number"
            value={userScore}
            onChange={(e) => setUserScore(e.target.value)}
            placeholder="0"
          />
        </div>
        <div>
          <Label htmlFor="rivalScore">Rival Score *</Label>
          <Input
            id="rivalScore"
            type="number"
            value={rivalScore}
            onChange={(e) => setRivalScore(e.target.value)}
            placeholder="0"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="rivalName">Rival Name *</Label>
        <Input
          id="rivalName"
          value={rivalName}
          onChange={(e) => setRivalName(e.target.value)}
          placeholder="Enter rival name"
        />
      </div>

      <div>
        <Label htmlFor="platform">Platform *</Label>
        <Select value={platform} onValueChange={setPlatform}>
          <SelectTrigger>
            <SelectValue placeholder="Select platform" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="eFootball">eFootball</SelectItem>
            <SelectItem value="FC25 Mobile">FC25 Mobile</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Screenshot (Optional)</Label>
        <div className="mt-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={handleFileChange}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="w-full"
          >
            <Camera className="w-4 h-4 mr-2" />
            Choose Screenshot
          </Button>
        </div>

        {previewUrl && (
          <div className="mt-4 relative">
            <Card>
              <CardContent className="p-2">
                <img
                  src={previewUrl}
                  alt="Screenshot preview"
                  className="w-full h-48 object-cover rounded"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={removeScreenshot}
                  className="absolute top-2 right-2"
                >
                  <X className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <div>
        <Label htmlFor="comment">Comment</Label>
        <Textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Add any comments about this match..."
          rows={3}
        />
      </div>

      <div className="flex gap-2 pt-4">
        <Button
          onClick={handleSave}
          disabled={isUploading}
          className="flex-1"
        >
          {isUploading ? 'Saving...' : 'Save Match'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          className="flex-1"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
