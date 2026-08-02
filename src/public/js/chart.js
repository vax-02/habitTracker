/**
 * Módulo de gráficos usando Chart.js
 */
class ChartsModule {
  constructor() {
    this.charts = {};
    this.colors = {
      primary: '#6366f1',
      success: '#22c55e',
      danger: '#ef4444',
      warning: '#f59e0b',
      info: '#3b82f6',
      purple: '#8b5cf6',
      pink: '#ec4899',
      gray: '#6b7280',
      lightGray: '#e5e7eb'
    };
  }

  /**
   * Crear gráfico de progreso semanal
   */
  createWeeklyChart(canvasId, data) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    // Destruir gráfico existente si existe
    if (this.charts[canvasId]) {
      this.charts[canvasId].destroy();
    }

    const days = data.map(d => d.dayName.substring(0, 3));
    const completed = data.map(d => d.completed);
    const total = data.map(d => d.total);

    this.charts[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: days,
        datasets: [
          {
            label: 'Completados',
            data: completed,
            backgroundColor: this.colors.success + '80',
            borderColor: this.colors.success,
            borderWidth: 2,
            borderRadius: 4,
            order: 1
          },
          {
            label: 'Totales',
            data: total,
            backgroundColor: this.colors.primary + '30',
            borderColor: this.colors.primary,
            borderWidth: 2,
            borderRadius: 4,
            borderDash: [5, 5],
            order: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              usePointStyle: true,
              padding: 20,
              font: {
                family: 'Inter',
                size: 12
              }
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.dataset.label || '';
                const value = context.raw || 0;
                return `${label}: ${value} hábitos`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: Math.max(...total) + 1 || 5,
            ticks: {
              stepSize: 1,
              font: {
                family: 'Inter',
                size: 11
              }
            }
          },
          x: {
            grid: {
              display: false
            }
          }
        }
      }
    });
  }

  /**
   * Crear gráfico de distribución de estados (Doughnut)
   */
  createStatusChart(canvasId, data) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    if (this.charts[canvasId]) {
      this.charts[canvasId].destroy();
    }

    const statusColors = {
      COMPLETED: this.colors.success,
      SKIPPED: this.colors.warning,
      FAILED: this.colors.danger,
      PENDING: this.colors.gray
    };

    const statusLabels = {
      COMPLETED: 'Completados',
      SKIPPED: 'Saltados',
      FAILED: 'Fallidos',
      PENDING: 'Pendientes'
    };

    const labels = data.map(d => statusLabels[d.status] || d.status);
    const values = data.map(d => d.count);
    const colors = data.map(d => statusColors[d.status] || this.colors.gray);

    this.charts[canvasId] = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: values,
          backgroundColor: colors,
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              usePointStyle: true,
              padding: 15,
              font: {
                family: 'Inter',
                size: 12
              }
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = total > 0 ? Math.round((context.parsed / total) * 100) : 0;
                return `${context.label}: ${context.parsed} (${percentage}%)`;
              }
            }
          }
        },
        cutout: '65%'
      },
      plugins: [{
        id: 'centerText',
        beforeDraw: function(chart) {
          const { width, height, ctx } = chart;
          ctx.save();
          const total = chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
          const completed = chart.data.datasets[0].data[0] || 0;
          const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
          
          ctx.font = 'bold 24px Inter';
          ctx.fillStyle = '#1f2937';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(`${percentage}%`, width / 2, height / 2 - 8);
          
          ctx.font = '12px Inter';
          ctx.fillStyle = '#6b7280';
          ctx.fillText('Completado', width / 2, height / 2 + 20);
          ctx.restore();
        }
      }]
    });
  }

  /**
   * Crear gráfico de racha (Line)
   */
  createStreakChart(canvasId, data) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    if (this.charts[canvasId]) {
      this.charts[canvasId].destroy();
    }

    const dates = data.map(d => d.date);
    const streaks = data.map(d => d.streak);

    this.charts[canvasId] = new Chart(ctx, {
      type: 'line',
      data: {
        labels: dates,
        datasets: [{
          label: 'Racha',
          data: streaks,
          borderColor: this.colors.warning,
          backgroundColor: this.colors.warning + '20',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: this.colors.warning,
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return `Racha: ${context.parsed.y} días`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
              font: {
                family: 'Inter',
                size: 11
              }
            }
          },
          x: {
            grid: {
              display: false
            }
          }
        }
      }
    });
  }

  /**
   * Crear gráfico de tendencia mensual
   */
  createMonthlyChart(canvasId, data) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    if (this.charts[canvasId]) {
      this.charts[canvasId].destroy();
    }

    this.charts[canvasId] = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.map(d => d.date),
        datasets: [
          {
            label: 'Completados',
            data: data.map(d => d.completed),
            borderColor: this.colors.success,
            backgroundColor: this.colors.success + '20',
            fill: true,
            tension: 0.4,
            pointBackgroundColor: this.colors.success,
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            pointRadius: 3,
            pointHoverRadius: 5
          },
          {
            label: 'Tasa de Completado %',
            data: data.map(d => d.rate),
            borderColor: this.colors.primary,
            backgroundColor: this.colors.primary + '20',
            fill: true,
            tension: 0.4,
            borderDash: [5, 5],
            pointBackgroundColor: this.colors.primary,
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            pointRadius: 3,
            pointHoverRadius: 5,
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              usePointStyle: true,
              padding: 15,
              font: {
                family: 'Inter',
                size: 12
              }
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                if (context.datasetIndex === 0) {
                  return `Completados: ${context.parsed.y}`;
                } else {
                  return `Tasa: ${context.parsed.y}%`;
                }
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            position: 'left',
            ticks: {
              stepSize: 1,
              font: {
                family: 'Inter',
                size: 11
              }
            }
          },
          y1: {
            beginAtZero: true,
            position: 'right',
            max: 100,
            ticks: {
              callback: function(value) {
                return value + '%';
              },
              font: {
                family: 'Inter',
                size: 11
              }
            },
            grid: {
              drawOnChartArea: false
            }
          },
          x: {
            grid: {
              display: false
            }
          }
        }
      }
    });
  }

  /**
   * Destruir todos los gráficos
   */
  destroyAll() {
    Object.keys(this.charts).forEach(key => {
      if (this.charts[key]) {
        this.charts[key].destroy();
        delete this.charts[key];
      }
    });
  }

  /**
   * Actualizar gráficos con nuevos datos
   */
  updateChart(chartId, data) {
    if (this.charts[chartId]) {
      this.charts[chartId].data = data;
      this.charts[chartId].update();
    }
  }
}

// Instancia global
const charts = new ChartsModule();