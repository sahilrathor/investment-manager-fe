import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { BarChart3 } from 'lucide-react';
import type { StockFundamentals } from '@/hooks/queries/useMarket';

function formatValue(val: number | null, suffix = '', prefix = ''): string {
  if (val === null || val === undefined) return 'N/A';
  return `${prefix}${typeof val === 'number' ? val.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : val}${suffix}`;
}

function formatMarketCap(val: number): string {
  if (val >= 1e12) return `${(val / 1e12).toFixed(2)}T`;
  if (val >= 1e7) return `${(val / 1e7).toFixed(2)}Cr`;
  if (val >= 1e5) return `${(val / 1e5).toFixed(2)}L`;
  return val.toLocaleString('en-IN');
}

interface FundamentalsTableProps {
  data: StockFundamentals;
  currency?: string;
}

export function FundamentalsTable({ data, currency = '₹' }: FundamentalsTableProps) {
  const rows = [
    { label: 'Market Cap', value: `${currency}${formatMarketCap(data.marketCap)}` },
    { label: 'PE Ratio', value: formatValue(data.peRatio) },
    { label: 'PB Ratio', value: formatValue(data.pbRatio) },
    { label: 'EPS', value: `${currency}${formatValue(data.eps)}` },
    { label: 'Book Value', value: `${currency}${formatValue(data.bookValue)}` },
    { label: 'ROE', value: data.roe !== null ? `${(data.roe * 100).toFixed(1)}%` : 'N/A' },
    { label: 'Debt to Equity', value: formatValue(data.debtToEquity) },
    { label: 'Revenue Growth', value: data.revenueGrowth !== null ? `${(data.revenueGrowth * 100).toFixed(1)}%` : 'N/A' },
    { label: 'Profit Growth', value: data.profitGrowth !== null ? `${(data.profitGrowth * 100).toFixed(1)}%` : 'N/A' },
    { label: 'Dividend Yield', value: data.dividendYield !== null ? `${(data.dividendYield * 100).toFixed(2)}%` : 'N/A' },
    { label: 'Operating Margin', value: data.operatingMargins !== null ? `${(data.operatingMargins * 100).toFixed(1)}%` : 'N/A' },
    { label: 'Profit Margin', value: data.profitMargins !== null ? `${(data.profitMargins * 100).toFixed(1)}%` : 'N/A' },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Fundamentals
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.label} className="border-b last:border-0">
                <TableCell className="py-2 text-muted-foreground text-sm">{row.label}</TableCell>
                <TableCell className="py-2 text-right font-medium text-sm">{row.value}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
