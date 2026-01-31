import { Link } from "react-router-dom";
import { GraduationCap, FileCheck, BarChart3, Shield, LogIn } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { EmptyState } from "@/components/ui/empty-state";

const features = [
  {
    icon: FileCheck,
    title: "Take Attendance",
    description: "Record student attendance securely on the blockchain",
    link: "/attendance",
    linkText: "Start Attendance",
    roles: ["teacher"],
  },
  {
    icon: GraduationCap,
    title: "View Records",
    description: "Search and view attendance records from the blockchain",
    link: "/records",
    linkText: "View Records",
    roles: ["student", "teacher"],
  },
  {
    icon: BarChart3,
    title: "Analytics",
    description: "Get insights and statistics from attendance data",
    link: "/analytics",
    linkText: "View Analytics",
    roles: ["teacher"],
  },
  {
    icon: Shield,
    title: "Check Integrity",
    description: "Verify blockchain integrity and detect tampering",
    link: "/integrity",
    linkText: "Check Integrity",
    roles: ["student", "teacher"],
  },
];

export default function HomePage() {
  const { role } = useAuth();

  const visibleFeatures = features.filter((feature) =>
    feature.roles.includes(role)
  );

  return (
    <div className="space-y-10 animate-fade-in">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl bg-gradient-to-r from-primary via-purple-500 to-cyan-500 bg-clip-text text-transparent animate-gradient-shift">
          Blockendance
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          A secure, blockchain-based attendance management system. Every record
          is immutable and cryptographically verified.
        </p>
      </div>

      {visibleFeatures.length === 0 ? (
        <EmptyState
          icon={LogIn}
          title="Log in to get started"
          description="Sign in to see attendance, records, analytics, and integrity tools based on your role."
          action={
            <Button asChild>
              <Link to="/login">Go to login</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {visibleFeatures.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card 
                key={feature.title} 
                className="flex flex-col glass-card hover-lift group border-white/10"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardHeader>
                  <div className="mb-2 p-3 rounded-lg bg-primary/10 w-fit group-hover:bg-primary/20 transition-colors">
                    <Icon className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="group-hover:text-primary transition-colors">{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex items-end">
                  <Button asChild className="w-full gradient-primary hover:opacity-90 transition-opacity">
                    <Link to={feature.link}>{feature.linkText}</Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
