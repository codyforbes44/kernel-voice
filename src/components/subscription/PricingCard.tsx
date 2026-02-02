import { Check, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface PricingCardProps {
  name: string;
  description: string;
  price: number;
  interval: 'month' | 'year';
  features: string[];
  isPopular?: boolean;
  isCurrentPlan?: boolean;
  onSelect: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  savings?: number;
}

export function PricingCard({
  name,
  description,
  price,
  interval,
  features,
  isPopular = false,
  isCurrentPlan = false,
  onSelect,
  isLoading = false,
  disabled = false,
  savings,
}: PricingCardProps) {
  return (
    <Card className={cn(
      "relative flex flex-col",
      isPopular && "border-primary shadow-lg scale-105",
      isCurrentPlan && "border-green-500 bg-green-500/5"
    )}>
      {isPopular && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
          <Sparkles className="h-3 w-3 mr-1" />
          Most Popular
        </Badge>
      )}
      {isCurrentPlan && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-500">
          <Check className="h-3 w-3 mr-1" />
          Your Plan
        </Badge>
      )}
      
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-xl">{name}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      
      <CardContent className="flex-1">
        <div className="text-center mb-6">
          <span className="text-4xl font-bold">${price}</span>
          <span className="text-muted-foreground">/{interval}</span>
          {savings && (
            <p className="text-sm text-green-600 mt-1">
              Save ${savings}/year
            </p>
          )}
        </div>
        
        <ul className="space-y-3">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2">
              <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      
      <CardFooter>
        <Button 
          className="w-full" 
          onClick={onSelect}
          disabled={disabled || isLoading || isCurrentPlan}
          variant={isCurrentPlan ? "outline" : isPopular ? "default" : "secondary"}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : isCurrentPlan ? (
            "Current Plan"
          ) : (
            "Get Started"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
