import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { generateAISummary } from './AISummaryGenerator';
import {
  Building2, Heart, TrendingUp, AlertTriangle, Calculator,
  Brain, ThumbsUp, ThumbsDown
} from 'lucide-react';
import type { StockFundamentals } from '@/hooks/queries/useMarket';

interface AISummaryProps {
  data: StockFundamentals | null;
  isLoading: boolean;
}

const iconMap: Record<string, React.ReactNode> = {
  building: <Building2 className="h-4 w-4" />,
  heart: <Heart className="h-4 w-4" />,
  'trending-up': <TrendingUp className="h-4 w-4" />,
  'alert-triangle': <AlertTriangle className="h-4 w-4" />,
  calculator: <Calculator className="h-4 w-4" />,
};

function ScoreBadge({ score }: { score: number }) {
  const variant = score >= 70 ? 'success' : score >= 45 ? 'warning' : 'destructive';
  return (
    <Badge variant={variant as any} className="text-xs">
      {score}/100
    </Badge>
  );
}

export function AISummary({ data, isLoading }: AISummaryProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Brain className="h-4 w-4" />
            AI Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-16 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Brain className="h-4 w-4" />
            AI Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">Fundamentals data not available for analysis.</p>
        </CardContent>
      </Card>
    );
  }

  const summary = generateAISummary(data);

  return (
    <div className="space-y-4">
      {/* Overall Score */}
      <Card className={cn(
        summary.overallScore >= 65 && 'border-profit/30',
        summary.overallScore < 45 && 'border-loss/30'
      )}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "flex h-12 w-12 items-center justify-center rounded-lg text-lg font-bold",
                summary.overallScore >= 70 ? 'bg-profit/10 text-profit' :
                summary.overallScore >= 45 ? 'bg-yellow-500/10 text-yellow-600' :
                'bg-loss/10 text-loss'
              )}>
                {summary.overallScore}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Overall Score</p>
                <p className="font-semibold">{summary.recommendation}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {summary.overallScore >= 65 ? (
                <ThumbsUp className="h-5 w-5 text-profit" />
              ) : summary.overallScore < 45 ? (
                <ThumbsDown className="h-5 w-5 text-loss" />
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sections */}
      {summary.sections.map((section) => (
        <Card key={section.title}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                {iconMap[section.icon] || <Building2 className="h-4 w-4" />}
                {section.title}
              </CardTitle>
              <ScoreBadge score={section.score} />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">{section.content}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
