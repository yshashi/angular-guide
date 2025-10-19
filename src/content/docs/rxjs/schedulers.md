---
title: Schedulers & Testing 🧪
description: Master RxJS schedulers and testing - control timing and test asynchronous code
sidebar:
  order: 9
---

Schedulers control **when** and **how** Observables execute. Learn how to test your RxJS code without waiting for real time!

## 🎯 What Are Schedulers?

**Schedulers** control the execution context of Observables - they decide when subscriptions happen and when notifications are delivered.

**Think of schedulers as:**
- A queue that decides when tasks run
- A way to control timing in tests
- A tool to optimize performance

**In Angular, you rarely need to use schedulers directly** - RxJS handles most timing automatically. But understanding them helps with testing!

## 🎯 Common Schedulers

### asyncScheduler

Schedules work for later (like setTimeout).

```typescript
import { of, asyncScheduler } from 'rxjs';
import { observeOn } from 'rxjs/operators';

// Execute asynchronously
of(1, 2, 3)
  .pipe(observeOn(asyncScheduler))
  .subscribe(console.log);

console.log('This runs first!');

// Output:
// "This runs first!"
// 1
// 2
// 3
```

### animationFrameScheduler

Perfect for animations - syncs with browser's repaint cycle.

```typescript
import { Component, signal } from '@angular/core';
import { interval, animationFrameScheduler } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-smooth-animation',
  standalone: true,
  template: `
    <div [style.transform]="'translateX(' + position() + 'px)'">
      Animated Box
    </div>
  `
})
export class SmoothAnimationComponent {
  position = signal(0);

  constructor() {
    // Runs on every animation frame
    interval(0, animationFrameScheduler)
      .pipe(takeUntilDestroyed())
      .subscribe(() => {
        this.position.update(p => (p + 1) % 500);
      });
  }
}
```

## 🎯 Testing RxJS Code

Testing time-based operators like `debounceTime`, `delay`, or `interval` can be tricky. You don't want tests to actually wait!

### Testing with fakeAsync

Angular's `fakeAsync` lets you control time in tests.

```typescript
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { FormControl } from '@angular/forms';
import { debounceTime } from 'rxjs/operators';

@Component({
  selector: 'app-search',
  standalone: true,
  template: ''
})
class SearchComponent {
  searchControl = new FormControl('');
  searchTerm = signal('');

  constructor() {
    this.searchControl.valueChanges
      .pipe(debounceTime(300))
      .subscribe(value => this.searchTerm.set(value || ''));
  }
}

describe('SearchComponent', () => {
  it('should debounce search input', fakeAsync(() => {
    const fixture = TestBed.createComponent(SearchComponent);
    const component = fixture.componentInstance;

    // Type something
    component.searchControl.setValue('test');
    
    // Time hasn't passed yet
    expect(component.searchTerm()).toBe('');
    
    // Fast-forward 300ms
    tick(300);
    
    // Now it should update!
    expect(component.searchTerm()).toBe('test');
  }));
});
```

### Testing with TestScheduler (Marble Testing)

**Marble testing** uses ASCII diagrams to represent Observable streams over time.

```typescript
import { TestScheduler } from 'rxjs/testing';
import { debounceTime, map } from 'rxjs/operators';

describe('Observable Tests', () => {
  let scheduler: TestScheduler;

  beforeEach(() => {
    scheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected);
    });
  });

  it('should debounce values', () => {
    scheduler.run(({ cold, expectObservable }) => {
      // Define input stream
      const input$ = cold('a-b-c---|');
      const expected =    '----c---|';
      
      // Apply operator
      const result$ = input$.pipe(
        debounceTime(30, scheduler)
      );
      
      // Assert
      expectObservable(result$).toBe(expected);
    });
  });

  it('should map values', () => {
    scheduler.run(({ cold, expectObservable }) => {
      const input$ = cold('  a-b-c|', { a: 1, b: 2, c: 3 });
      const expected =      ' a-b-c|';
      const expectedValues = { a: 2, b: 4, c: 6 };
      
      const result$ = input$.pipe(
        map(x => x * 2)
      );
      
      expectObservable(result$).toBe(expected, expectedValues);
    });
  });
});
```

### Marble Diagram Syntax

```
'-'  = 10ms of time passing
'|'  = completion
'#'  = error
'a'  = emission of value 'a'
'(ab)' = emissions happening at same time
'^'  = subscription point
```

## 🎨 Real-World Testing Example

Let's test a search component with debouncing:

```typescript
import { TestBed } from '@angular/core/testing';
import { TestScheduler } from 'rxjs/testing';
import { SearchService } from './search.service';

describe('SearchService', () => {
  let service: SearchService;
  let scheduler: TestScheduler;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SearchService);
    
    scheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected);
    });
  });

  it('should debounce and search', () => {
    scheduler.run(({ cold, expectObservable, flush }) => {
      // Simulate user typing
      const searchTerms$ = cold('a-b-c---|', {
        a: 'ang',
        b: 'angu',
        c: 'angular'
      });
      
      // Expected output (debounced)
      const expected = '------c-|';
      const expectedValues = { c: ['angular-result'] };
      
      // Mock HTTP response
      spyOn(service['http'], 'get').and.returnValue(
        cold('--x|', { x: ['angular-result'] })
      );
      
      const result$ = searchTerms$.pipe(
        service.searchOperator()
      );
      
      expectObservable(result$).toBe(expected, expectedValues);
    });
  });
});
```

## ✅ Testing Best Practices

```typescript
// ✅ Good - Use fakeAsync for simple timing
it('should wait 1 second', fakeAsync(() => {
  let called = false;
  setTimeout(() => called = true, 1000);
  
  tick(1000);
  expect(called).toBe(true);
}));

// ✅ Good - Use TestScheduler for complex streams
it('should handle complex timing', () => {
  scheduler.run(({ cold, expectObservable }) => {
    const input$ = cold(' a-b-c|');
    const expected =     '---c|';
    // ... test logic
  });
});

// ✅ Good - Test error handling
it('should handle errors', () => {
  scheduler.run(({ cold, expectObservable }) => {
    const input$ = cold('a-#', {}, new Error('test'));
    const expected =    'a-#';
    
    expectObservable(input$).toBe(expected);
  });
});
```

## 🎯 Quick Testing Guide

### When to Use What

| Scenario | Tool | Example |
|----------|------|---------|
| Simple delays | `fakeAsync + tick` | `setTimeout`, `delay` |
| Complex streams | `TestScheduler` | Multiple operators |
| HTTP calls | `HttpTestingController` | API requests |
| Component testing | `ComponentFixture` | UI interactions |

### Example: Test HTTP with Debounce

```typescript
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

describe('DataService', () => {
  let service: DataService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    
    service = TestBed.inject(DataService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should debounce and fetch data', fakeAsync(() => {
    let result: any;
    
    service.search('test').subscribe(data => result = data);
    
    // Wait for debounce
    tick(300);
    
    // Expect HTTP request
    const req = httpMock.expectOne('/api/search?q=test');
    req.flush({ results: ['item1', 'item2'] });
    
    expect(result).toEqual({ results: ['item1', 'item2'] });
    
    httpMock.verify();
  }));
});
```

## 🎓 Learning Checklist

- [ ] Understand what schedulers do
- [ ] Use fakeAsync for simple timing tests
- [ ] Use TestScheduler for complex streams
- [ ] Write marble tests
- [ ] Test debounced operations
- [ ] Test error scenarios
- [ ] Mock HTTP requests in tests

## 🚀 Next Steps

1. **[RxJS Patterns](/rxjs/angular-patterns/)** - Common patterns and best practices
2. **[Testing Guide](/testing/unit-testing/)** - Complete testing guide
3. **[Service Testing](/testing/service-testing/)** - Test Angular services

---

**Pro Tip**: Use **fakeAsync + tick** for simple tests. Use **TestScheduler** when you need precise control over timing. Don't make your tests actually wait - control time instead! 🧪
