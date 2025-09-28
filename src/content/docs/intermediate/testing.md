---
title: Testing Fundamentals 🧪
description: Learn the fundamentals of testing Angular applications
sidebar:
  order: 10
---

Testing is like having a safety net for your code - it catches bugs before they reach users and gives you confidence to make changes. Think of tests as your code's quality assurance team, working 24/7 to ensure everything works as expected.

## 🎯 Why Test Your Angular App?

**Imagine shipping a car without testing the brakes** - that's what deploying untested code feels like. Testing provides:

**Key Benefits:**
- **Bug Prevention** - Catch issues before users do
- **Confidence** - Make changes without fear of breaking things
- **Documentation** - Tests show how your code should work
- **Refactoring Safety** - Change implementation while keeping functionality
- **Team Collaboration** - Clear expectations for how components behave

## 🧪 Types of Testing

### Unit Tests - Testing Individual Pieces

**Unit tests are like testing each ingredient before cooking** - you verify each component works correctly in isolation.

```typescript
// user.service.spec.ts
describe('UserService', () => {
  let service: UserService;
  let httpMock: jasmine.SpyObj<HttpClient>;

  beforeEach(() => {
    const httpSpy = jasmine.createSpyObj('HttpClient', ['get', 'post', 'put', 'delete']);
    
    TestBed.configureTestingModule({
      providers: [
        UserService,
        { provide: HttpClient, useValue: httpSpy }
      ]
    });
    
    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpClient) as jasmine.SpyObj<HttpClient>;
  });

  it('should create user service', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch users from API', () => {
    const mockUsers = [
      { id: 1, name: 'John Doe', email: 'john@example.com' },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
    ];

    httpMock.get.and.returnValue(of(mockUsers));

    service.getUsers().subscribe(users => {
      expect(users).toEqual(mockUsers);
      expect(users.length).toBe(2);
    });

    expect(httpMock.get).toHaveBeenCalledWith('/api/users');
  });

  it('should handle API errors gracefully', () => {
    const errorResponse = new HttpErrorResponse({
      error: 'Server Error',
      status: 500,
      statusText: 'Internal Server Error'
    });

    httpMock.get.and.returnValue(throwError(() => errorResponse));

    service.getUsers().subscribe({
      next: () => fail('Expected error, but got success'),
      error: (error) => {
        expect(error.status).toBe(500);
      }
    });
  });
});
```

### Component Testing - Testing UI Logic

**Component tests are like testing a complete dish** - you verify the component renders correctly and responds to user interactions.

```typescript
// user-card.component.spec.ts
describe('UserCardComponent', () => {
  let component: UserCardComponent;
  let fixture: ComponentFixture<UserCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserCardComponent] // Standalone component
    }).compileComponents();

    fixture = TestBed.createComponent(UserCardComponent);
    component = fixture.componentInstance;
  });

  it('should create component', () => {
    expect(component).toBeTruthy();
  });

  it('should display user information', () => {
    const mockUser = {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      role: 'Admin'
    };

    // Set input using signal
    component.user.set(mockUser);
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('h3').textContent).toContain('John Doe');
    expect(compiled.querySelector('.email').textContent).toContain('john@example.com');
    expect(compiled.querySelector('.role').textContent).toContain('Admin');
  });

  it('should emit edit event when edit button clicked', () => {
    const mockUser = { id: 1, name: 'John Doe', email: 'john@example.com' };
    component.user.set(mockUser);
    
    spyOn(component.edit, 'emit');

    const editButton = fixture.nativeElement.querySelector('.edit-btn');
    editButton.click();

    expect(component.edit.emit).toHaveBeenCalledWith(mockUser);
  });

  it('should show admin badge for admin users', () => {
    const adminUser = { id: 1, name: 'Admin User', role: 'Admin' };
    component.user.set(adminUser);
    fixture.detectChanges();

    const adminBadge = fixture.nativeElement.querySelector('.admin-badge');
    expect(adminBadge).toBeTruthy();
  });

  it('should hide admin badge for regular users', () => {
    const regularUser = { id: 1, name: 'Regular User', role: 'User' };
    component.user.set(regularUser);
    fixture.detectChanges();

    const adminBadge = fixture.nativeElement.querySelector('.admin-badge');
    expect(adminBadge).toBeFalsy();
  });
});
```

## 🔧 Testing Signals and Modern Patterns

**Testing signals is like testing a smart thermostat** - you verify it responds correctly to changes and updates dependent systems.

```typescript
// counter.component.spec.ts
describe('CounterComponent with Signals', () => {
  let component: CounterComponent;
  let fixture: ComponentFixture<CounterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CounterComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(CounterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should initialize with zero count', () => {
    expect(component.count()).toBe(0);
    expect(component.isEven()).toBeTruthy();
    expect(component.doubleCount()).toBe(0);
  });

  it('should increment count when increment button clicked', () => {
    const incrementBtn = fixture.nativeElement.querySelector('.increment-btn');
    
    incrementBtn.click();
    fixture.detectChanges();

    expect(component.count()).toBe(1);
    expect(component.isEven()).toBeFalsy();
    expect(component.doubleCount()).toBe(2);
  });

  it('should update computed values when count changes', () => {
    component.count.set(4);
    fixture.detectChanges();

    expect(component.isEven()).toBeTruthy();
    expect(component.doubleCount()).toBe(8);

    component.count.set(7);
    fixture.detectChanges();

    expect(component.isEven()).toBeFalsy();
    expect(component.doubleCount()).toBe(14);
  });

  it('should reset count to zero', () => {
    component.count.set(10);
    
    const resetBtn = fixture.nativeElement.querySelector('.reset-btn');
    resetBtn.click();

    expect(component.count()).toBe(0);
  });
});
```

## 📋 Testing Reactive Forms

**Form testing is like testing a questionnaire** - you verify it collects the right information and validates correctly.

```typescript
// contact-form.component.spec.ts
describe('ContactFormComponent', () => {
  let component: ContactFormComponent;
  let fixture: ComponentFixture<ContactFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ContactFormComponent,
        ReactiveFormsModule,
        NoopAnimationsModule // Disable animations for testing
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ContactFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create form with initial values', () => {
    expect(component.contactForm.get('name')?.value).toBe('');
    expect(component.contactForm.get('email')?.value).toBe('');
    expect(component.contactForm.get('message')?.value).toBe('');
  });

  it('should validate required fields', () => {
    const nameControl = component.contactForm.get('name');
    const emailControl = component.contactForm.get('email');
    
    expect(nameControl?.valid).toBeFalsy();
    expect(emailControl?.valid).toBeFalsy();
    
    nameControl?.setValue('John Doe');
    emailControl?.setValue('john@example.com');
    
    expect(nameControl?.valid).toBeTruthy();
    expect(emailControl?.valid).toBeTruthy();
  });

  it('should validate email format', () => {
    const emailControl = component.contactForm.get('email');
    
    emailControl?.setValue('invalid-email');
    expect(emailControl?.hasError('email')).toBeTruthy();
    
    emailControl?.setValue('valid@email.com');
    expect(emailControl?.hasError('email')).toBeFalsy();
  });

  it('should submit form with valid data', () => {
    spyOn(component, 'onSubmit');
    
    component.contactForm.patchValue({
      name: 'John Doe',
      email: 'john@example.com',
      message: 'Test message'
    });

    const form = fixture.nativeElement.querySelector('form');
    form.dispatchEvent(new Event('submit'));

    expect(component.onSubmit).toHaveBeenCalled();
  });

  it('should disable submit button when form is invalid', () => {
    const submitButton = fixture.nativeElement.querySelector('button[type="submit"]');
    expect(submitButton.disabled).toBeTruthy();

    component.contactForm.patchValue({
      name: 'John Doe',
      email: 'john@example.com',
      message: 'Test message'
    });
    fixture.detectChanges();

    expect(submitButton.disabled).toBeFalsy();
  });
});
```

## 🎭 Testing with Mocks and Spies

**Mocks and spies are like stunt doubles** - they stand in for real dependencies so you can test in isolation.

```typescript
// user-list.component.spec.ts
describe('UserListComponent', () => {
  let component: UserListComponent;
  let fixture: ComponentFixture<UserListComponent>;
  let userService: jasmine.SpyObj<UserService>;

  beforeEach(async () => {
    const userServiceSpy = jasmine.createSpyObj('UserService', ['getUsers', 'deleteUser']);

    await TestBed.configureTestingModule({
      imports: [UserListComponent],
      providers: [
        { provide: UserService, useValue: userServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(UserListComponent);
    component = fixture.componentInstance;
    userService = TestBed.inject(UserService) as jasmine.SpyObj<UserService>;
  });

  it('should load users on init', () => {
    const mockUsers = [
      { id: 1, name: 'John Doe' },
      { id: 2, name: 'Jane Smith' }
    ];

    userService.getUsers.and.returnValue(of(mockUsers));

    component.ngOnInit();

    expect(userService.getUsers).toHaveBeenCalled();
    expect(component.users()).toEqual(mockUsers);
  });

  it('should handle loading state', () => {
    userService.getUsers.and.returnValue(of([]).pipe(delay(100)));

    component.ngOnInit();

    expect(component.loading()).toBeTruthy();
  });

  it('should delete user when confirmed', () => {
    const userToDelete = { id: 1, name: 'John Doe' };
    spyOn(window, 'confirm').and.returnValue(true);
    userService.deleteUser.and.returnValue(of({}));

    component.deleteUser(userToDelete);

    expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete John Doe?');
    expect(userService.deleteUser).toHaveBeenCalledWith(1);
  });

  it('should not delete user when cancelled', () => {
    const userToDelete = { id: 1, name: 'John Doe' };
    spyOn(window, 'confirm').and.returnValue(false);

    component.deleteUser(userToDelete);

    expect(userService.deleteUser).not.toHaveBeenCalled();
  });
});
```

## 🧩 Testing Custom Pipes

**Testing pipes is like testing a translator** - you verify it converts input to the expected output format.

```typescript
// truncate.pipe.spec.ts
describe('TruncatePipe', () => {
  let pipe: TruncatePipe;

  beforeEach(() => {
    pipe = new TruncatePipe();
  });

  it('should create pipe', () => {
    expect(pipe).toBeTruthy();
  });

  it('should return original text if shorter than limit', () => {
    const result = pipe.transform('Short text', 20);
    expect(result).toBe('Short text');
  });

  it('should truncate text longer than limit', () => {
    const longText = 'This is a very long text that should be truncated';
    const result = pipe.transform(longText, 20);
    expect(result).toBe('This is a very long...');
  });

  it('should use custom trail string', () => {
    const longText = 'This is a very long text';
    const result = pipe.transform(longText, 10, ' (more)');
    expect(result).toBe('This is a (more)');
  });

  it('should handle null and undefined values', () => {
    expect(pipe.transform(null as any)).toBe('');
    expect(pipe.transform(undefined as any)).toBe('');
  });

  it('should handle empty string', () => {
    expect(pipe.transform('')).toBe('');
  });
});
```

## ✅ Best Practices

### 1. **Write Descriptive Test Names**
```typescript
// ✅ Good - Descriptive test names
it('should display error message when email is invalid', () => {});
it('should emit user selected event when card is clicked', () => {});

// ❌ Avoid - Vague test names
it('should work', () => {});
it('should test component', () => {});
```

### 2. **Use AAA Pattern (Arrange, Act, Assert)**
```typescript
it('should calculate total price correctly', () => {
  // Arrange
  const items = [
    { price: 10, quantity: 2 },
    { price: 5, quantity: 3 }
  ];
  
  // Act
  const total = component.calculateTotal(items);
  
  // Assert
  expect(total).toBe(35);
});
```

### 3. **Test Behavior, Not Implementation**
```typescript
// ✅ Good - Testing behavior
it('should show loading spinner while fetching data', () => {
  component.loadData();
  expect(component.loading()).toBeTruthy();
});

// ❌ Avoid - Testing implementation details
it('should call private method _setLoadingState', () => {
  spyOn(component as any, '_setLoadingState');
  component.loadData();
  expect(component._setLoadingState).toHaveBeenCalled();
});
```

## 🎯 Quick Checklist

- [ ] Write unit tests for services and utilities
- [ ] Test component rendering and user interactions
- [ ] Validate form behavior and validation
- [ ] Mock external dependencies (HTTP, services)
- [ ] Test error handling and edge cases
- [ ] Use descriptive test names
- [ ] Follow AAA pattern (Arrange, Act, Assert)
- [ ] Test signals and computed values
- [ ] Disable animations in tests
- [ ] Test accessibility features

## 🚀 Next Steps

1. **[E2E Testing](/advanced/e2e-testing/)** - End-to-end testing with Cypress
2. **[Performance Testing](/advanced/performance-testing/)** - Testing app performance
3. **[CI/CD Integration](/advanced/ci-cd/)** - Automated testing pipelines

---

**Remember**: Testing is like insurance for your code - you hope you never need it, but you'll be grateful when you do. Start with the most critical parts of your app and build your test suite gradually! 🧪
