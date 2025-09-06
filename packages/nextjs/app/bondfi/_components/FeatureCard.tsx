"use client";
import { Card } from "~~/components/ui/card";

import { LucideIcon } from "lucide-react";

interface FeatureCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  gradient?: string;
}

export function FeatureCard({ title, description, icon: Icon, gradient = "bg-gradient-card" }: FeatureCardProps) {
  return (
    <Card className={`p-6 ${gradient} backdrop-blur-sm border-border/20 shadow-glass hover:shadow-glow transition-all duration-300 group cursor-pointer`}>
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="p-4 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
          <Icon className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h3 className="text-xl font-semibold mb-2">{title}</h3>
          <p className="text-muted-foreground">{description}</p>
        </div>
      </div>
    </Card>
  );
}
