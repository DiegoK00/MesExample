import { Component, OnInit, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';
import { ReportsService } from '../../../core/services/reports.service';
import { TopArticleResponse, ProductionKpiResponse } from '../../../core/models/report.models';
import type { EChartsOption } from 'echarts';

@Component({
  selector: 'app-reports',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideEchartsCore({ echarts: () => import('echarts') })],
  imports: [
    CommonModule,
    MatCardModule, MatTableModule, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatSnackBarModule, MatTooltipModule, MatDividerModule,
    NgxEchartsDirective
  ],
  template: `
    <div class="page-header">
      <h2><mat-icon>bar_chart</mat-icon> Report & KPI</h2>
    </div>

    @if (loading()) {
      <div class="spinner-center"><mat-spinner /></div>
    } @else {

      <!-- KPI Cards -->
      @if (kpi(); as k) {
        <div class="kpi-grid">
          <mat-card class="kpi-card">
            <mat-card-content>
              <div class="kpi-value">{{ k.totalArticlesActive }}</div>
              <div class="kpi-label">Articoli attivi</div>
            </mat-card-content>
          </mat-card>
          <mat-card class="kpi-card warn">
            <mat-card-content>
              <div class="kpi-value">{{ k.totalArticlesInactive }}</div>
              <div class="kpi-label">Articoli inattivi</div>
            </mat-card-content>
          </mat-card>
          <mat-card class="kpi-card accent">
            <mat-card-content>
              <div class="kpi-value">{{ k.totalBomParents }}</div>
              <div class="kpi-label">Distinte base</div>
            </mat-card-content>
          </mat-card>
          <mat-card class="kpi-card accent">
            <mat-card-content>
              <div class="kpi-value">{{ k.avgComponentsPerBom }}</div>
              <div class="kpi-label">Media componenti/BOM</div>
            </mat-card-content>
          </mat-card>
          <mat-card class="kpi-card">
            <mat-card-content>
              <div class="kpi-value">{{ k.articlesCreatedLast30Days }}</div>
              <div class="kpi-label">Creati (30gg)</div>
            </mat-card-content>
          </mat-card>
          <mat-card class="kpi-card">
            <mat-card-content>
              <div class="kpi-value">{{ k.totalScrapPercentageAvg | number:'1.1-1' }}%</div>
              <div class="kpi-label">Scarto medio</div>
            </mat-card-content>
          </mat-card>
        </div>
      }

      <!-- Charts row -->
      <div class="charts-row">

        <!-- Bar chart: top articoli -->
        <mat-card class="chart-card">
          <mat-card-header>
            <mat-card-title>Articoli più richiesti</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            @if (barChartOptions()) {
              <div echarts [options]="barChartOptions()!" class="chart"></div>
            }
          </mat-card-content>
        </mat-card>

        <!-- Pie chart: per categoria -->
        <mat-card class="chart-card">
          <mat-card-header>
            <mat-card-title>Articoli per categoria</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            @if (pieChartOptions()) {
              <div echarts [options]="pieChartOptions()!" class="chart"></div>
            }
          </mat-card-content>
        </mat-card>

      </div>

      <!-- Line chart: trend creazione -->
      @if (lineChartOptions()) {
        <mat-card class="chart-card full-width">
          <mat-card-header>
            <mat-card-title>Trend creazione articoli (ultimi 6 mesi)</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div echarts [options]="lineChartOptions()!" class="chart"></div>
          </mat-card-content>
        </mat-card>
      }

      <!-- Tabella top articoli con export -->
      <mat-card class="table-card">
        <mat-card-header>
          <mat-card-title>Dettaglio articoli più richiesti</mat-card-title>
          <div class="export-buttons">
            <button mat-stroked-button color="warn" (click)="exportPdf()" matTooltip="Esporta PDF">
              <mat-icon>picture_as_pdf</mat-icon> PDF
            </button>
            <button mat-stroked-button color="primary" (click)="exportExcel()" matTooltip="Esporta Excel articoli">
              <mat-icon>table_view</mat-icon> Excel articoli
            </button>
            <button mat-stroked-button color="accent" (click)="exportKpiExcel()" matTooltip="Esporta KPI in Excel">
              <mat-icon>insights</mat-icon> Excel KPI
            </button>
          </div>
        </mat-card-header>
        <mat-card-content>
          <table mat-table [dataSource]="topArticles()">

            <ng-container matColumnDef="rank">
              <th mat-header-cell *matHeaderCellDef>#</th>
              <td mat-cell *matCellDef="let a; let i = index">{{ i + 1 }}</td>
            </ng-container>

            <ng-container matColumnDef="code">
              <th mat-header-cell *matHeaderCellDef>Codice</th>
              <td mat-cell *matCellDef="let a"><code>{{ a.code }}</code></td>
            </ng-container>

            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>Nome</th>
              <td mat-cell *matCellDef="let a">{{ a.name }}</td>
            </ng-container>

            <ng-container matColumnDef="category">
              <th mat-header-cell *matHeaderCellDef>Categoria</th>
              <td mat-cell *matCellDef="let a">{{ a.categoryName }}</td>
            </ng-container>

            <ng-container matColumnDef="usageCount">
              <th mat-header-cell *matHeaderCellDef>Utilizzi BOM</th>
              <td mat-cell *matCellDef="let a"><strong>{{ a.usageCount }}</strong></td>
            </ng-container>

            <ng-container matColumnDef="totalQuantity">
              <th mat-header-cell *matHeaderCellDef>Qtà totale</th>
              <td mat-cell *matCellDef="let a">{{ a.totalQuantity | number:'1.2-2' }} {{ a.umName }}</td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="tableColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: tableColumns;"></tr>
          </table>
        </mat-card-content>
      </mat-card>

    }
  `,
  styles: [`
    .page-header { display: flex; align-items: center; margin-bottom: 24px; }
    .page-header h2 { display: flex; align-items: center; gap: 8px; margin: 0; }
    .spinner-center { display: flex; justify-content: center; padding: 64px; }

    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
    .kpi-card { text-align: center; }
    .kpi-card.warn .kpi-value { color: #e53935; }
    .kpi-card.accent .kpi-value { color: #1565c0; }
    .kpi-value { font-size: 2rem; font-weight: 700; line-height: 1.2; }
    .kpi-label { font-size: 0.8rem; color: #666; margin-top: 4px; }

    .charts-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 24px;
    }
    .chart-card { margin-bottom: 24px; }
    .chart-card.full-width { width: 100%; }
    .chart { height: 300px; width: 100%; }

    .table-card table { width: 100%; }
    mat-card-header { display: flex; justify-content: space-between; align-items: center; }
    .export-buttons { display: flex; gap: 8px; }
    code { background: #f0f0f0; padding: 2px 6px; border-radius: 4px; font-size: 0.85rem; }
  `]
})
export class ReportsComponent implements OnInit {
  private reportsService = inject(ReportsService);
  private snackBar = inject(MatSnackBar);

  loading = signal(true);
  topArticles = signal<TopArticleResponse[]>([]);
  kpi = signal<ProductionKpiResponse | null>(null);
  barChartOptions = signal<EChartsOption | null>(null);
  pieChartOptions = signal<EChartsOption | null>(null);
  lineChartOptions = signal<EChartsOption | null>(null);

  tableColumns = ['rank', 'code', 'name', 'category', 'usageCount', 'totalQuantity'];

  ngOnInit(): void {
    this.loadAll();
  }

  private loadAll(): void {
    this.loading.set(true);
    let done = 0;
    const checkDone = () => { if (++done === 2) this.loading.set(false); };

    this.reportsService.getTopArticles(10).subscribe({
      next: rows => {
        this.topArticles.set(rows);
        this.buildBarChart(rows);
        checkDone();
      },
      error: () => { this.snackBar.open('Errore caricamento articoli', 'OK', { duration: 3000 }); checkDone(); }
    });

    this.reportsService.getProductionKpi().subscribe({
      next: k => {
        this.kpi.set(k);
        this.buildPieChart(k);
        this.buildLineChart(k);
        checkDone();
      },
      error: () => { this.snackBar.open('Errore caricamento KPI', 'OK', { duration: 3000 }); checkDone(); }
    });
  }

  private buildBarChart(rows: TopArticleResponse[]): void {
    this.barChartOptions.set({
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'value' },
      yAxis: {
        type: 'category',
        data: [...rows].reverse().map(r => r.code),
        axisLabel: { fontSize: 11 }
      },
      series: [{
        name: 'Utilizzi BOM',
        type: 'bar',
        data: [...rows].reverse().map(r => r.usageCount),
        itemStyle: { color: '#1565C0' },
        label: { show: true, position: 'right' }
      }]
    });
  }

  private buildPieChart(k: ProductionKpiResponse): void {
    this.pieChartOptions.set({
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: { orient: 'vertical', right: 10, top: 'center' },
      series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['40%', '50%'],
        data: k.articlesByCategory.map(c => ({ name: c.categoryName, value: c.articleCount })),
        label: { show: false },
        emphasis: { label: { show: true, fontSize: 13, fontWeight: 'bold' } }
      }]
    });
  }

  private buildLineChart(k: ProductionKpiResponse): void {
    this.lineChartOptions.set({
      tooltip: { trigger: 'axis' },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'category', data: k.creationTrend.map(t => t.month), boundaryGap: false },
      yAxis: { type: 'value', minInterval: 1 },
      series: [{
        name: 'Articoli creati',
        type: 'line',
        data: k.creationTrend.map(t => t.count),
        smooth: true,
        areaStyle: { opacity: 0.15 },
        itemStyle: { color: '#1565C0' }
      }]
    });
  }

  exportPdf(): void {
    this.reportsService.exportTopArticlesPdf().subscribe({
      next: blob => this.downloadBlob(blob, `articoli-top-${this.today()}.pdf`),
      error: () => this.snackBar.open('Errore export PDF', 'OK', { duration: 3000 })
    });
  }

  exportExcel(): void {
    this.reportsService.exportTopArticlesExcel().subscribe({
      next: blob => this.downloadBlob(blob, `articoli-top-${this.today()}.xlsx`),
      error: () => this.snackBar.open('Errore export Excel', 'OK', { duration: 3000 })
    });
  }

  exportKpiExcel(): void {
    this.reportsService.exportKpiExcel().subscribe({
      next: blob => this.downloadBlob(blob, `kpi-produzione-${this.today()}.xlsx`),
      error: () => this.snackBar.open('Errore export KPI Excel', 'OK', { duration: 3000 })
    });
  }

  private downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  private today(): string {
    return new Date().toISOString().slice(0, 10).replace(/-/g, '');
  }
}
