---
title: Pipes & Custom Pipes 🔧
description: Transform data with Angular pipes and create custom ones
sidebar:
  order: 8
---

Pipes are like filters for your data - they take raw information and transform it into a format that's perfect for display. Think of them as the formatting tools that make your data look exactly how you want it in the user interface.

## 🎯 What Are Pipes?

**Imagine pipes as a series of processing stations** - your data goes in one end, gets transformed along the way, and comes out perfectly formatted on the other side. They're pure functions that don't change the original data, just how it appears.

**Why Use Pipes?**
- **Clean Templates** - Keep formatting logic out of components
- **Reusable** - Use the same pipe across multiple components
- **Pure Functions** - Predictable transformations
- **Performance** - Angular optimizes pipe execution

## 🔧 Built-in Pipes

### Text Transformation Pipes

**These pipes are like text editors** - they help you format strings exactly how you need them.

```typescript
@Component({
  selector: 'app-text-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div>
      <h3>Text Transformation Examples</h3>
      
      <!-- Original text -->
      <p>Original: {{userInput()}}</p>
      
      <!-- Text transformations -->
      <p>Uppercase: {{userInput() | uppercase}}</p>
      <p>Lowercase: {{userInput() | lowercase}}</p>
      <p>Title Case: {{userInput() | titlecase}}</p>
      
      <!-- Slicing text -->
      <p>First 10 chars: {{userInput() | slice:0:10}}</p>
      <p>Last 5 chars: {{userInput() | slice:-5}}</p>
      
      <input [(ngModel)]="inputValue" (input)="updateInput()">
    </div>
  `
})
export class TextDemoComponent {
  inputValue = 'hello world from angular pipes';
  userInput = signal(this.inputValue);

  updateInput() {
    this.userInput.set(this.inputValue);
  }
}
```

### Number and Currency Pipes

**These pipes are like calculators and accountants** - they format numbers, currencies, and percentages perfectly.

```typescript
@Component({
  selector: 'app-number-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div>
      <h3>Number Formatting Examples</h3>
      
      <!-- Basic number formatting -->
      <p>Raw number: {{price()}}</p>
      <p>Decimal places: {{price() | number:'1.2-2'}}</p>
      <p>With commas: {{largeNumber() | number:'1.0-0'}}</p>
      
      <!-- Currency formatting -->
      <p>USD: {{price() | currency:'USD':'symbol':'1.2-2'}}</p>
      <p>EUR: {{price() | currency:'EUR':'symbol':'1.2-2'}}</p>
      <p>Custom: {{price() | currency:'USD':'symbol-narrow':'1.0-0'}}</p>
      
      <!-- Percentage -->
      <p>Percentage: {{percentage() | percent:'1.1-1'}}</p>
      
      <!-- Controls -->
      <div>
        <label>Price: 
          <input type="number" [(ngModel)]="priceValue" (input)="updatePrice()">
        </label>
        <label>Percentage: 
          <input type="number" [(ngModel)]="percentValue" (input)="updatePercent()" step="0.01">
        </label>
      </div>
    </div>
  `
})
export class NumberDemoComponent {
  priceValue = 1234.56;
  percentValue = 0.85;
  
  price = signal(this.priceValue);
  percentage = signal(this.percentValue);
  largeNumber = signal(1234567);

  updatePrice() {
    this.price.set(this.priceValue);
  }

  updatePercent() {
    this.percentage.set(this.percentValue);
  }
}
```

### Date Pipes

**Date pipes are like time machines** - they can display dates and times in any format you need, for any timezone.

```typescript
@Component({
  selector: 'app-date-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div>
      <h3>Date Formatting Examples</h3>
      
      <!-- Current date in different formats -->
      <p>Raw date: {{currentDate()}}</p>
      <p>Short: {{currentDate() | date:'short'}}</p>
      <p>Medium: {{currentDate() | date:'medium'}}</p>
      <p>Long: {{currentDate() | date:'long'}}</p>
      <p>Full: {{currentDate() | date:'full'}}</p>
      
      <!-- Custom formats -->
      <p>Custom: {{currentDate() | date:'dd/MM/yyyy HH:mm'}}</p>
      <p>Day name: {{currentDate() | date:'EEEE, MMMM d, y'}}</p>
      <p>Time only: {{currentDate() | date:'HH:mm:ss'}}</p>
      
      <!-- Relative time -->
      <p>Created: {{createdDate() | date:'short'}}</p>
      <p>Time ago: {{timeAgo()}}</p>
      
      <button (click)="updateTime()">Update Current Time</button>
    </div>
  `
})
export class DateDemoComponent implements OnInit {
  currentDate = signal(new Date());
  createdDate = signal(new Date(Date.now() - 2 * 60 * 60 * 1000)); // 2 hours ago
  
  timeAgo = computed(() => {
    const now = this.currentDate().getTime();
    const created = this.createdDate().getTime();
    const diffMinutes = Math.floor((now - created) / (1000 * 60));
    
    if (diffMinutes < 60) {
      return `${diffMinutes} minutes ago`;
    } else {
      const diffHours = Math.floor(diffMinutes / 60);
      return `${diffHours} hours ago`;
    }
  });

  ngOnInit() {
    // Update time every second
    setInterval(() => {
      this.currentDate.set(new Date());
    }, 1000);
  }

  updateTime() {
    this.currentDate.set(new Date());
  }
}
```

## 🎨 Creating Custom Pipes

**Custom pipes are like building your own specialized tools** - when the built-in ones don't do exactly what you need.

### Simple Custom Pipe

```typescript
// highlight.pipe.ts
@Pipe({
  name: 'highlight'
})
export class HighlightPipe implements PipeTransform {
  transform(text: string, searchTerm: string): string {
    if (!text || !searchTerm) {
      return text;
    }
    
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }
}

// Usage in component
@Component({
  selector: 'app-search-results',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HighlightPipe],
  template: `
    <div>
      <input [(ngModel)]="searchTerm" placeholder="Search...">
      
      @for (item of searchResults(); track item.id) {
        <div [innerHTML]="item.title | highlight:searchTerm"></div>
      }
    </div>
  `
})
export class SearchResultsComponent {
  searchTerm = '';
  
  searchResults = signal([
    { id: 1, title: 'Angular Pipes Tutorial' },
    { id: 2, title: 'Custom Pipe Examples' },
    { id: 3, title: 'Pipe Performance Tips' }
  ]);
}
```

### Advanced Custom Pipe with Parameters

```typescript
// truncate.pipe.ts
@Pipe({
  name: 'truncate'
})
export class TruncatePipe implements PipeTransform {
  transform(
    text: string, 
    limit: number = 50, 
    trail: string = '...'
  ): string {
    if (!text) return '';
    
    if (text.length <= limit) {
      return text;
    }
    
    return text.substring(0, limit).trim() + trail;
  }
}

// file-size.pipe.ts
@Pipe({
  name: 'fileSize'
})
export class FileSizePipe implements PipeTransform {
  transform(bytes: number, precision: number = 1): string {
    if (bytes === 0) return '0 B';
    
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const base = 1024;
    const unitIndex = Math.floor(Math.log(bytes) / Math.log(base));
    const size = bytes / Math.pow(base, unitIndex);
    
    return `${size.toFixed(precision)} ${units[unitIndex]}`;
  }
}

// Component using custom pipes
@Component({
  selector: 'app-file-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TruncatePipe, FileSizePipe],
  template: `
    <div>
      <h3>File List</h3>
      
      @for (file of files(); track file.id) {
        <div>
          <div>
            <strong>{{file.name | truncate:30}}</strong>
          </div>
          <div>
            Size: {{file.size | fileSize:2}}
          </div>
          <div>
            Description: {{file.description | truncate:100:'... (read more)'}}
          </div>
        </div>
      }
    </div>
  `
})
export class FileListComponent {
  files = signal([
    {
      id: 1,
      name: 'very-long-filename-that-needs-truncation.pdf',
      size: 2048576,
      description: 'This is a very long description that explains what this file contains and why it might be important for the user to understand its contents.'
    },
    {
      id: 2,
      name: 'image.jpg',
      size: 524288,
      description: 'A beautiful landscape photo taken during vacation.'
    }
  ]);
}
```

### Async Pipe Alternative with Signals

**Modern approach: Converting observables to signals instead of using async pipe.**

```typescript
// Modern signal-based approach
@Component({
  selector: 'app-user-profile',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div>
      @if (user()) {
        <div>
          <h2>{{user()!.name}}</h2>
          <p>{{user()!.email}}</p>
          <p>Joined: {{user()!.joinDate | date:'mediumDate'}}</p>
        </div>
      } @else if (loading()) {
        <div>Loading user...</div>
      } @else {
        <div>User not found</div>
      }
    </div>
  `
})
export class UserProfileComponent {
  private userService = inject(UserService);
  private route = inject(ActivatedRoute);
  
  // Convert observable to signal
  user = toSignal(
    this.route.params.pipe(
      switchMap(params => this.userService.getUser(params['id']))
    )
  );
  
  loading = signal(false);
}
```

## 🔄 Pipe Chaining and Composition

**Pipe chaining is like an assembly line** - each pipe does one job, and you can combine them for complex transformations.

```typescript
@Component({
  selector: 'app-pipe-chaining',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TruncatePipe, HighlightPipe],
  template: `
    <div>
      <h3>Pipe Chaining Examples</h3>
      
      <input [(ngModel)]="searchTerm" placeholder="Search term">
      
      @for (post of posts(); track post.id) {
        <article>
          <!-- Chain multiple pipes -->
          <h4 [innerHTML]="post.title | truncate:50 | highlight:searchTerm"></h4>
          
          <!-- Complex chaining -->
          <p [innerHTML]="post.content | truncate:200:'...' | highlight:searchTerm"></p>
          
          <small>
            {{post.author | titlecase}} • 
            {{post.publishDate | date:'shortDate'}} • 
            {{post.readTime}} min read
          </small>
        </article>
      }
    </div>
  `
})
export class PipeChainingComponent {
  searchTerm = '';
  
  posts = signal([
    {
      id: 1,
      title: 'Understanding Angular Pipes and Their Power',
      content: 'Angular pipes are a powerful feature that allows you to transform data in your templates. They provide a clean way to format and display data without cluttering your component logic.',
      author: 'john doe',
      publishDate: new Date('2024-01-15'),
      readTime: 5
    },
    {
      id: 2,
      title: 'Custom Pipes: Building Your Own Data Transformers',
      content: 'Creating custom pipes in Angular gives you the flexibility to implement any data transformation you need. This article covers best practices and common patterns.',
      author: 'jane smith',
      publishDate: new Date('2024-02-01'),
      readTime: 8
    }
  ]);
}
```

## 🚀 Performance Considerations

**Pure vs Impure Pipes - Understanding the difference is crucial for performance.**

```typescript
// Pure pipe (default) - only runs when input changes
@Pipe({
  name: 'expensiveCalculation',
  pure: true // This is the default
})
export class ExpensiveCalculationPipe implements PipeTransform {
  transform(value: number): number {
    console.log('Pure pipe executed'); // Only logs when value changes
    
    // Expensive calculation
    let result = value;
    for (let i = 0; i < 1000000; i++) {
      result = Math.sqrt(result + 1);
    }
    return result;
  }
}

// Impure pipe - runs on every change detection cycle
@Pipe({
  name: 'currentTime',
  pure: false // Runs every change detection cycle
})
export class CurrentTimePipe implements PipeTransform {
  transform(): string {
    console.log('Impure pipe executed'); // Logs frequently
    return new Date().toLocaleTimeString();
  }
}

// Better approach: Use signals for frequently changing data
@Component({
  selector: 'app-performance-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div>
      <!-- Pure pipe - good performance -->
      <p>Calculation: {{inputValue() | expensiveCalculation}}</p>
      
      <!-- Impure pipe - use sparingly -->
      <p>Current time (impure): {{'' | currentTime}}</p>
      
      <!-- Better approach with signals -->
      <p>Current time (signal): {{currentTime()}}</p>
      
      <input type="number" [(ngModel)]="value" (input)="updateValue()">
    </div>
  `
})
export class PerformanceDemoComponent implements OnInit, OnDestroy {
  value = 100;
  inputValue = signal(this.value);
  currentTime = signal(new Date().toLocaleTimeString());
  
  private timeInterval?: number;

  ngOnInit() {
    // Update time with signal instead of impure pipe
    this.timeInterval = window.setInterval(() => {
      this.currentTime.set(new Date().toLocaleTimeString());
    }, 1000);
  }

  ngOnDestroy() {
    if (this.timeInterval) {
      clearInterval(this.timeInterval);
    }
  }

  updateValue() {
    this.inputValue.set(this.value);
  }
}
```

## ✅ Best Practices

### 1. **Keep Pipes Pure When Possible**
```typescript
// ✅ Good - Pure pipe for simple transformations
@Pipe({ name: 'capitalize', pure: true })
export class CapitalizePipe implements PipeTransform {
  transform(value: string): string {
    return value ? value.charAt(0).toUpperCase() + value.slice(1) : '';
  }
}

// ❌ Avoid - Impure pipes for simple transformations
@Pipe({ name: 'capitalize', pure: false })
export class BadCapitalizePipe { /* ... */ }
```

### 2. **Use Signals Instead of Async Pipe**
```typescript
// ✅ Modern approach - Convert to signal
export class Component {
  data = toSignal(this.service.getData());
}

// ✅ Still valid - Async pipe for simple cases
@Component({
  template: `{{data$ | async}}`
})
export class Component {
  data$ = this.service.getData();
}
```

### 3. **Handle Null and Undefined Values**
```typescript
@Pipe({ name: 'safeTransform' })
export class SafeTransformPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    // Always handle null/undefined cases
    if (!value) return '';
    
    return value.toUpperCase();
  }
}
```

## 🎯 Quick Checklist

- [ ] Use built-in pipes for common transformations
- [ ] Create custom pipes for reusable logic
- [ ] Keep pipes pure for better performance
- [ ] Handle null/undefined values gracefully
- [ ] Use pipe chaining for complex transformations
- [ ] Consider signals instead of async pipe
- [ ] Test custom pipes thoroughly
- [ ] Use meaningful pipe names
- [ ] Document complex pipe logic

## 🚀 Next Steps

1. **[Angular Material](/intermediate/material/)** - UI components with built-in pipes
2. **[Testing](/intermediate/testing/)** - Testing custom pipes
3. **[Performance](/advanced/performance/)** - Optimizing pipe performance

---

**Remember**: Pipes are like specialized tools in your toolkit - use the right one for each job, and don't be afraid to create custom ones when you need something specific. Keep them simple, pure, and focused on one transformation! 🔧
