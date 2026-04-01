import type { StockFundamentals } from '@/hooks/queries/useMarket';

export interface AISummarySection {
  title: string;
  content: string;
  score: number;
  icon: string;
}

export interface AISummary {
  sections: AISummarySection[];
  overallScore: number;
  recommendation: 'Strong Buy' | 'Buy' | 'Hold' | 'Sell' | 'Strong Sell';
}

function formatMarketCap(cap: number): string {
  if (cap >= 1e12) return `${(cap / 1e12).toFixed(1)}T`;
  if (cap >= 1e9) return `${(cap / 1e9).toFixed(1)}B`;
  if (cap >= 1e6) return `${(cap / 1e6).toFixed(1)}M`;
  return cap.toFixed(0);
}

function formatPercent(val: number | null): string {
  if (val === null) return 'N/A';
  return `${(val * 100).toFixed(1)}%`;
}

export function generateAISummary(data: StockFundamentals): AISummary {
  const sections: AISummarySection[] = [];

  // 1. Company Overview
  const overviewScore = data.marketCap > 1e11 ? 90 : data.marketCap > 1e10 ? 70 : data.marketCap > 1e9 ? 50 : 30;
  sections.push({
    title: 'Company Overview',
    icon: 'building',
    score: overviewScore,
    content: `This is a ${data.marketCap > 1e11 ? 'large-cap' : data.marketCap > 1e10 ? 'mid-cap' : 'small-cap'} company with a market capitalization of ${formatMarketCap(data.marketCap)}. The stock is currently trading at ${data.currentPrice?.toFixed(2) || 'N/A'}, which is ${data.distanceFrom52WeekHigh?.toFixed(1) || 'N/A'}% below its 52-week high and ${data.distanceFrom52WeekLow?.toFixed(1) || 'N/A'}% above its 52-week low.`,
  });

  // 2. Financial Health
  let healthScore = 50;
  const healthPoints: string[] = [];

  if (data.debtToEquity !== null) {
    if (data.debtToEquity < 0.3) { healthScore += 20; healthPoints.push('very low debt levels'); }
    else if (data.debtToEquity < 1) { healthScore += 10; healthPoints.push('manageable debt'); }
    else { healthScore -= 15; healthPoints.push('elevated debt levels'); }
  }

  if (data.currentRatio !== null) {
    if (data.currentRatio > 2) { healthScore += 15; healthPoints.push('strong liquidity'); }
    else if (data.currentRatio > 1) { healthScore += 5; healthPoints.push('adequate liquidity'); }
    else { healthScore -= 10; healthPoints.push('potential liquidity concerns'); }
  }

  if (data.profitMargins !== null) {
    if (data.profitMargins > 0.2) { healthScore += 15; healthPoints.push('excellent profit margins'); }
    else if (data.profitMargins > 0.1) { healthScore += 5; healthPoints.push('healthy profit margins'); }
    else if (data.profitMargins > 0) { healthPoints.push('thin profit margins'); }
    else { healthScore -= 20; healthPoints.push('negative profit margins'); }
  }

  sections.push({
    title: 'Financial Health',
    icon: 'heart',
    score: Math.min(100, Math.max(0, healthScore)),
    content: `The company shows ${healthPoints.length > 0 ? healthPoints.join(', ') : 'limited financial data available'}. ${data.debtToEquity !== null ? `Debt-to-equity ratio stands at ${data.debtToEquity.toFixed(2)}.` : ''} ${data.operatingMargins !== null ? `Operating margins are at ${formatPercent(data.operatingMargins)}.` : ''}`,
  });

  // 3. Growth Potential
  let growthScore = 50;
  const growthPoints: string[] = [];

  if (data.revenueGrowth !== null) {
    if (data.revenueGrowth > 0.25) { growthScore += 25; growthPoints.push(`strong revenue growth of ${formatPercent(data.revenueGrowth)}`); }
    else if (data.revenueGrowth > 0.1) { growthScore += 15; growthPoints.push(`solid revenue growth of ${formatPercent(data.revenueGrowth)}`); }
    else if (data.revenueGrowth > 0) { growthScore += 5; growthPoints.push(`modest revenue growth of ${formatPercent(data.revenueGrowth)}`); }
    else { growthScore -= 15; growthPoints.push(`declining revenue (${formatPercent(data.revenueGrowth)})`); }
  }

  if (data.profitGrowth !== null) {
    if (data.profitGrowth > 0.2) { growthScore += 20; growthPoints.push(`impressive profit growth of ${formatPercent(data.profitGrowth)}`); }
    else if (data.profitGrowth > 0.1) { growthScore += 10; growthPoints.push(`healthy profit growth of ${formatPercent(data.profitGrowth)}`); }
    else if (data.profitGrowth > 0) { growthPoints.push(`slight profit growth of ${formatPercent(data.profitGrowth)}`); }
    else { growthScore -= 15; growthPoints.push(`declining profits (${formatPercent(data.profitGrowth)})`); }
  }

  sections.push({
    title: 'Growth Potential',
    icon: 'trending-up',
    score: Math.min(100, Math.max(0, growthScore)),
    content: `${growthPoints.length > 0 ? `The company demonstrates ${growthPoints.join(' and ')}.` : 'Growth data is limited.'} ${data.roe !== null ? `Return on equity is ${formatPercent(data.roe)}, indicating ${data.roe > 0.15 ? 'efficient capital utilization' : data.roe > 0.1 ? 'reasonable returns' : 'below-average returns'}.` : ''}`,
  });

  // 4. Risk Factors
  let riskScore = 70;
  const riskPoints: string[] = [];

  if (data.peRatio !== null && data.peRatio > 50) { riskScore -= 20; riskPoints.push('high valuation (PE > 50)'); }
  if (data.debtToEquity !== null && data.debtToEquity > 2) { riskScore -= 20; riskPoints.push('high debt levels'); }
  if (data.distanceFrom52WeekHigh !== null && data.distanceFrom52WeekHigh > 40) { riskScore -= 10; riskPoints.push('significant decline from 52-week high'); }
  if (data.profitGrowth !== null && data.profitGrowth < 0) { riskScore -= 15; riskPoints.push('declining profits'); }

  sections.push({
    title: 'Risk Factors',
    icon: 'alert-triangle',
    score: Math.min(100, Math.max(0, riskScore)),
    content: riskPoints.length > 0
      ? `Key risks include: ${riskPoints.join(', ')}. Investors should monitor these factors closely.`
      : 'No major risk factors identified based on current fundamentals. Standard market risks apply.',
  });

  // 5. Valuation
  let valuationScore = 50;
  if (data.peRatio !== null && data.peRatio > 0) {
    if (data.peRatio < 15) valuationScore += 25;
    else if (data.peRatio < 25) valuationScore += 15;
    else if (data.peRatio < 35) valuationScore += 5;
    else valuationScore -= 15;
  }
  if (data.pbRatio !== null && data.pbRatio > 0) {
    if (data.pbRatio < 1.5) valuationScore += 15;
    else if (data.pbRatio < 3) valuationScore += 5;
    else valuationScore -= 10;
  }

  sections.push({
    title: 'Valuation',
    icon: 'calculator',
    score: Math.min(100, Math.max(0, valuationScore)),
    content: `The stock trades at a PE ratio of ${data.peRatio?.toFixed(1) || 'N/A'} and PB ratio of ${data.pbRatio?.toFixed(2) || 'N/A'}. ${data.eps !== null ? `Earnings per share stands at ${data.eps.toFixed(2)}.` : ''} ${data.dividendYield !== null && data.dividendYield > 0 ? `The stock offers a dividend yield of ${formatPercent(data.dividendYield)}.` : 'The stock does not currently pay dividends.'}`,
  });

  // Calculate overall score and recommendation
  const overallScore = Math.round(sections.reduce((sum, s) => sum + s.score, 0) / sections.length);
  let recommendation: AISummary['recommendation'];
  if (overallScore >= 80) recommendation = 'Strong Buy';
  else if (overallScore >= 65) recommendation = 'Buy';
  else if (overallScore >= 45) recommendation = 'Hold';
  else if (overallScore >= 30) recommendation = 'Sell';
  else recommendation = 'Strong Sell';

  return { sections, overallScore, recommendation };
}
