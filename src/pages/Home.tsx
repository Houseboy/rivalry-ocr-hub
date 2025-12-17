import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Trophy, Upload, BarChart3, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { PublicLeagueCard } from "../components/league/PublicLeagueCard";
import { usePublicLeagues } from "../hooks/usePublicLeagues";
import { useNavigate } from "react-router-dom";
import heroImage from "../assets/hero-rivalry.png";

const Home = () => {
  const navigate = useNavigate();
  const { leagues: publicLeagues, loading: leaguesLoading, userMemberships, handleJoinLeague } = usePublicLeagues(3);
  const howItWorksSteps = [
    {
      icon: Upload,
      title: "Upload Screenshot",
      description: "Take a screenshot of your match result and upload it to FRT",
    },
    {
      icon: BarChart3,
      title: "Auto-Extract Data",
      description: "Our OCR technology automatically extracts scores and match details",
    },
    {
      icon: Trophy,
      title: "Track & Compete",
      description: "View your stats, climb the league table, and claim bragging rights",
    },
  ];

  const newsItems = [
    {
      title: "Welcome to FRT!",
      description: "Start tracking your football gaming matches and settle rivalries once and for all.",
      date: "Today",
    },
    {
      title: "League Table Feature Live",
      description: "Compete with your friends and see who truly rules the virtual pitch.",
      date: "2 days ago",
    },
    {
      title: "OCR Technology Powered",
      description: "Simply upload screenshots - we'll extract all the match data automatically.",
      date: "1 week ago",
    },
  ];

  return (
    <div className="min-h-screen pb-20 md:pb-0 md:pt-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden h-screen min-h-[600px] md:min-h-[700px] flex items-center justify-center">
        {/* Background Video */}
        <video
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          className="absolute inset-0 w-full h-full object-cover md:object-cover animate-fade-in"
          style={{
            objectPosition: 'center center',
          }}
        >
          <source src="/hero-ad.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/30 to-background/50" />
        
        <div className="relative container mx-auto px-4 sm:px-6 text-center z-10">
          <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6 md:space-y-8">
            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black mb-4 text-foreground animate-fade-in tracking-tight leading-tight px-2">
              <span className="text-white/70 drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
                Track Matches.
              </span>
              <br />
              <span className="text-white/70 drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
                Settle Rivalries.
              </span>
            </h1>
            
            {/* Subheading */}
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent animate-fade-in delay-100 drop-shadow-lg opacity-80 px-2">
              Rule the Game.
            </h2>
            
            {/* Supporting Text */}
            <p className="text-base sm:text-lg md:text-xl text-white/60 max-w-2xl mx-auto animate-fade-in delay-200 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] font-medium leading-relaxed px-4">
              Log matches, view stats, and claim bragging rights over your rivals.
            </p>
            
            {/* CTA Button */}
            <div className="pt-2 sm:pt-4 animate-fade-in delay-300">
              <Link to="/profile" className="inline-block">
                <Button 
                  size="lg" 
                  className="text-base sm:text-lg px-6 sm:px-10 py-5 sm:py-7 rounded-full bg-gradient-primary hover:opacity-90 hover:scale-105 transition-all duration-300 shadow-[0_10px_40px_rgba(33,100,220,0.4)] hover:shadow-[0_15px_50px_rgba(33,100,220,0.6)] group font-bold"
                >
                  <Upload className="w-5 h-5 sm:w-6 sm:h-6 mr-2 group-hover:scale-110 group-hover:-translate-y-0.5 transition-all duration-300" />
                  Log First Match
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 relative overflow-hidden">
        {/* Background Image with Overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-50"
          style={{ 
            backgroundImage: `url(${heroImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/50 to-background/60" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent pointer-events-none" />
        <div className="container mx-auto px-4 relative">
          <h2 className="text-3xl font-bold text-center mb-12 animate-fade-in">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {howItWorksSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <Card 
                  key={index} 
                  className="p-6 text-center hover:shadow-primary transition-all duration-500 hover:scale-105 hover:-translate-y-2 bg-gradient-card animate-fade-in group"
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-primary mb-4 transition-all duration-300 group-hover:scale-110 group-hover:rotate-12 shadow-primary">
                    <Icon className="w-8 h-8 text-primary-foreground transition-transform duration-300 group-hover:scale-110" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 transition-colors duration-300 group-hover:text-primary">
                    {index + 1}. {step.title}
                  </h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Public Leagues Section */}
      <section className="py-16 relative">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold animate-fade-in">
              Public Leagues
            </h2>
          </div>
          
          {leaguesLoading ? (
            <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {[...Array(3)].map((_, index) => (
                <Card key={index} className="animate-pulse h-64 bg-muted" />
              ))}
            </div>
          ) : publicLeagues.length === 0 ? (
            <Card className="text-center py-12 max-w-2xl mx-auto">
              <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Public Leagues Yet</h3>
              <p className="text-muted-foreground mb-4">
                Be the first to create a public league and start the competition!
              </p>
              <Link to="/league">
                <Button>Create League</Button>
              </Link>
            </Card>
          ) : (
            <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {publicLeagues.map((league, index) => (
                <PublicLeagueCard
                  key={league.id}
                  id={league.id}
                  name={league.name}
                  description={league.description || undefined}
                  leagueType={league.league_type}
                  selectedTeam={league.selected_team}
                  currentParticipants={league.member_count}
                  maxParticipants={league.max_participants || 20}
                  hasStarted={league.has_started || false}
                  isPublic={league.is_public}
                  isUserMember={userMemberships.has(league.id)}
                  onJoin={() => handleJoinLeague(league.id)}
                  onView={() => navigate(`/league/${league.id}`)}
                />
              ))}
            </div>
          )}
          
          {/* View All Button */}
          {!leaguesLoading && publicLeagues.length > 0 && (
            <div className="text-center mt-8">
              <Link to="/public-leagues">
                <Button 
                  variant="outline" 
                  size="lg"
                  className="border-2 hover:bg-gray-50"
                >
                  <Trophy className="w-4 h-4 mr-2" />
                  View All Public Leagues
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* News & Updates */}
      <section className="py-16 relative">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8 animate-fade-in">
            News & Updates
          </h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {newsItems.map((item, index) => (
              <Card 
                key={index} 
                className="p-6 hover:shadow-primary transition-all duration-500 hover:scale-105 cursor-pointer bg-gradient-card group animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-start justify-between mb-3">
                  <Trophy className="w-6 h-6 text-primary transition-all duration-300 group-hover:scale-125 group-hover:rotate-12" />
                  <span className="text-xs text-muted-foreground transition-colors duration-300 group-hover:text-primary">
                    {item.date}
                  </span>
                </div>
                <h3 className="text-lg font-bold mb-2 transition-colors duration-300 group-hover:text-primary">
                  {item.title}
                </h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
                <div className="mt-4 h-1 w-0 bg-gradient-primary rounded-full transition-all duration-500 group-hover:w-full" />
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-10 right-1/4 w-64 h-64 bg-accent/10 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>
        <div className="container mx-auto px-4 text-center relative">
          <h2 className="text-3xl font-bold mb-4 text-foreground animate-fade-in">
            Ready to Start Your Journey?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 animate-fade-in delay-200">
            Upload your first match and join the competition.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in delay-300">
            <Link to="/profile">
              <Button size="lg" variant="secondary" className="group hover:shadow-primary transition-all duration-300 hover:scale-105">
                <Upload className="w-5 h-5 transition-all duration-300 group-hover:scale-110 group-hover:-translate-y-1" />
                Upload Match
              </Button>
            </Link>
            <Link to="/league">
              <Button size="lg" variant="outline" className="group hover:shadow-primary transition-all duration-300 hover:scale-105">
                <Users className="w-5 h-5 transition-all duration-300 group-hover:scale-110" />
                View League
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
