---
title: Lifecycle Hooks 🔄
description: Master Angular component lifecycle hooks
sidebar:
  order: 3
---

Angular lifecycle hooks provide precise control over component initialization, updates, and cleanup. Master these hooks to build efficient, responsive applications.

## 🎯 Essential Lifecycle Hooks

- **OnInit** - Component initialization
- **OnDestroy** - Cleanup and unsubscription
- **OnChanges** - Input property changes
- **AfterViewInit** - View initialization complete
- **DoCheck** - Custom change detection

## 🚀 OnInit - Component Initialization

```typescript
@Component({
  selector: 'app-user-profile',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div>
      @if (user()) {
        <h2>{{user()!.name}}</h2>
        <p>{{user()!.email}}</p>
      }
      @if (loading()) {
        <div>Loading...</div>
      }
    </div>
  `
})
export class UserProfileComponent implements OnInit {
  userId = input.required<number>();
  
  user = signal<User | null>(null);
  loading = signal(false);
  
  private userService = inject(UserService);

  ngOnInit() {
    this.loadUser();
  }

  private loadUser() {
    this.loading.set(true);
    this.userService.getUser(this.userId()).subscribe({
      next: user => {
        this.user.set(user);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }
}
```

## 🧹 OnDestroy - Cleanup

```typescript
@Component({
  selector: 'app-timer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div>
      <h3>Timer: {{seconds()}}</h3>
      <button (click)="toggle()">{{isRunning() ? 'Pause' : 'Start'}}</button>
      <button (click)="reset()">Reset</button>
    </div>
  `
})
export class TimerComponent implements OnInit, OnDestroy {
  seconds = signal(0);
  isRunning = signal(false);
  
  private intervalId?: number;

  ngOnInit() {
    this.startTimer();
  }

  ngOnDestroy() {
    this.clearTimer();
  }

  toggle() {
    if (this.isRunning()) {
      this.pauseTimer();
    } else {
      this.startTimer();
    }
  }

  private startTimer() {
    if (!this.intervalId) {
      this.intervalId = window.setInterval(() => {
        this.seconds.update(s => s + 1);
      }, 1000);
      this.isRunning.set(true);
    }
  }

  private pauseTimer() {
    this.clearTimer();
    this.isRunning.set(false);
  }

  private clearTimer() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
  }

  reset() {
    this.clearTimer();
    this.seconds.set(0);
    this.isRunning.set(false);
  }
}
```

## 🔄 OnChanges - Input Changes

```typescript
@Component({
  selector: 'app-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div>
      <h3>{{title()}}</h3>
      @if (processedData()) {
        <div>Chart with {{processedData()!.length}} data points</div>
      }
    </div>
  `
})
export class ChartComponent implements OnChanges {
  title = input('Chart');
  data = input<number[]>([]);
  
  processedData = signal<ProcessedData[] | null>(null);

  ngOnChanges(changes: SimpleChanges) {
    if (changes['data'] && this.data()) {
      this.processData();
    }
  }

  private processData() {
    const processed = this.data().map((value, index) => ({
      x: index,
      y: value,
      label: `Point ${index + 1}`
    }));
    this.processedData.set(processed);
  }
}

interface ProcessedData {
  x: number;
  y: number;
  label: string;
}
```

## 👁️ AfterViewInit - View Ready

```typescript
@Component({
  selector: 'app-canvas-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div>
      <canvas #chartCanvas width="400" height="200"></canvas>
    </div>
  `
})
export class CanvasChartComponent implements AfterViewInit {
  @ViewChild('chartCanvas') canvas!: ElementRef<HTMLCanvasElement>;
  
  data = input<number[]>([]);

  ngAfterViewInit() {
    this.drawChart();
  }

  private drawChart() {
    const ctx = this.canvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const data = this.data();
    const width = 400;
    const height = 200;

    ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle = '#007bff';
    ctx.lineWidth = 2;

    if (data.length > 1) {
      ctx.beginPath();
      data.forEach((value, index) => {
        const x = (index / (data.length - 1)) * width;
        const y = height - (value / Math.max(...data)) * height;
        
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();
    }
  }
}
```

## 🔍 DoCheck - Custom Change Detection

```typescript
@Component({
  selector: 'app-optimized-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div>
      <p>Checks: {{checkCount()}}</p>
      @for (item of items(); track item.id) {
        <div>{{item.name}} - {{item.value}}</div>
      }
    </div>
  `
})
export class OptimizedListComponent implements DoCheck {
  items = input<Item[]>([]);
  
  checkCount = signal(0);
  private lastItemsLength = 0;

  ngDoCheck() {
    this.checkCount.update(count => count + 1);
    
    // Custom change detection logic
    const currentLength = this.items().length;
    if (currentLength !== this.lastItemsLength) {
      console.log('Items length changed:', currentLength);
      this.lastItemsLength = currentLength;
    }
  }
}

interface Item {
  id: number;
  name: string;
  value: number;
}
```

## 🎨 Practical Example: Data Fetcher

```typescript
@Component({
  selector: 'app-data-fetcher',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div>
      <h2>Data Fetcher</h2>
      
      @if (loading()) {
        <div>Loading data...</div>
      }
      
      @if (error()) {
        <div>Error: {{error()}}</div>
        <button (click)="retry()">Retry</button>
      }
      
      @if (data()) {
        <div>
          <h3>Results ({{data()!.length}})</h3>
          @for (item of data(); track item.id) {
            <div>{{item.title}}</div>
          }
        </div>
      }
    </div>
  `
})
export class DataFetcherComponent implements OnInit, OnDestroy {
  endpoint = input.required<string>();
  
  data = signal<DataItem[] | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);
  
  private http = inject(HttpClient);
  private subscription?: Subscription;

  ngOnInit() {
    this.fetchData();
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }

  private fetchData() {
    this.loading.set(true);
    this.error.set(null);
    
    this.subscription = this.http.get<DataItem[]>(this.endpoint()).subscribe({
      next: data => {
        this.data.set(data);
        this.loading.set(false);
      },
      error: err => {
        this.error.set('Failed to load data');
        this.loading.set(false);
      }
    });
  }

  retry() {
    this.fetchData();
  }
}

interface DataItem {
  id: number;
  title: string;
}
```

## ✅ Best Practices

### 1. **Always Cleanup in OnDestroy**
```typescript
// ✅ Good
ngOnDestroy() {
  this.subscription?.unsubscribe();
  clearInterval(this.intervalId);
}

// ❌ Avoid memory leaks
ngOnDestroy() {
  // Missing cleanup
}
```

### 2. **Use Signals for State**
```typescript
// ✅ Good - Signal-based state
export class Component {
  data = signal<Data[]>([]);
  loading = signal(false);
}

// ❌ Avoid - Traditional properties with OnPush
export class Component {
  data: Data[] = [];
  loading = false;
}
```

### 3. **Minimize DoCheck Usage**
```typescript
// ✅ Use DoCheck sparingly for custom logic
ngDoCheck() {
  // Only essential custom change detection
}

// ❌ Avoid heavy operations in DoCheck
ngDoCheck() {
  this.expensiveCalculation(); // Bad performance
}
```

## 🎯 Quick Checklist

- [ ] Use OnInit for component initialization
- [ ] Always cleanup in OnDestroy
- [ ] Handle input changes with OnChanges
- [ ] Use AfterViewInit for DOM access
- [ ] Minimize DoCheck usage
- [ ] Unsubscribe from observables
- [ ] Clear timers and intervals
- [ ] Use signals for reactive state

## 🚀 Next Steps

1. **[Reactive Forms](/intermediate/reactive-forms/)** - Build complex forms
2. **[RxJS & Observables](/intermediate/rxjs/)** - Master reactive programming
3. **[State Management](/intermediate/state-management/)** - Advanced state patterns

---

**Remember**: Lifecycle hooks provide precise control over component behavior. Use them wisely to create efficient, leak-free applications! 🔄
