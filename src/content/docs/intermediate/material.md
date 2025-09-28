---
title: Angular Material 🎨
description: Build beautiful UIs with Angular Material components
sidebar:
  order: 9
---

Angular Material is like having a professional design team at your fingertips - it provides pre-built, accessible, and beautiful UI components that follow Google's Material Design principles. Think of it as a comprehensive toolkit that makes your app look polished and professional without the design headaches.

## 🎯 Why Angular Material?

**Imagine building a house with pre-fabricated, high-quality components** instead of crafting every piece from scratch. Angular Material gives you:

**Key Benefits:**
- **Consistent Design** - All components follow Material Design guidelines
- **Accessibility** - Built-in ARIA support and keyboard navigation
- **Theming** - Easy customization with CSS custom properties
- **Responsive** - Works perfectly on all screen sizes
- **Well-tested** - Battle-tested components used by millions

## 🚀 Getting Started

### Installation and Setup

```bash
# Install Angular Material, CDK, and Animations
ng add @angular/material

# This command will:
# 1. Install the packages
# 2. Add Material Icons font
# 3. Set up global typography styles
# 4. Add animations module
```

### Basic Setup in Your App

```typescript
// app.config.ts - Modern standalone approach
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideAnimationsAsync(), // Required for Material animations
    // ... other providers
  ]
};

// Import Material modules as needed in components
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
```

## 🎨 Essential Components

### Buttons - The Building Blocks

**Buttons are like the handshakes of your app** - they're often the first interaction users have, so they need to feel right.

```typescript
@Component({
  selector: 'app-button-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatIconModule],
  template: `
    <div>
      <h3>Button Varieties</h3>
      
      <!-- Basic buttons -->
      <button mat-button>Basic</button>
      <button mat-raised-button>Raised</button>
      <button mat-flat-button>Flat</button>
      <button mat-stroked-button>Stroked</button>
      
      <!-- Colored buttons -->
      <button mat-raised-button color="primary">Primary</button>
      <button mat-raised-button color="accent">Accent</button>
      <button mat-raised-button color="warn">Warn</button>
      
      <!-- Icon buttons -->
      <button mat-icon-button>
        <mat-icon>favorite</mat-icon>
      </button>
      
      <button mat-fab>
        <mat-icon>add</mat-icon>
      </button>
      
      <button mat-mini-fab>
        <mat-icon>edit</mat-icon>
      </button>
      
      <!-- Buttons with icons and text -->
      <button mat-raised-button>
        <mat-icon>save</mat-icon>
        Save Document
      </button>
      
      <!-- Disabled state -->
      <button mat-raised-button [disabled]="isLoading()">
        {{isLoading() ? 'Saving...' : 'Save'}}
      </button>
    </div>
  `
})
export class ButtonDemoComponent {
  isLoading = signal(false);

  save() {
    this.isLoading.set(true);
    setTimeout(() => this.isLoading.set(false), 2000);
  }
}
```

### Cards - Content Containers

**Cards are like digital business cards** - they present information in an organized, scannable way.

```typescript
@Component({
  selector: 'app-card-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatCardModule, MatButtonModule, MatIconModule],
  template: `
    <div>
      <h3>Card Examples</h3>
      
      <!-- Simple card -->
      <mat-card>
        <mat-card-header>
          <mat-card-title>Simple Card</mat-card-title>
          <mat-card-subtitle>Basic card example</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <p>This is a simple card with just text content.</p>
        </mat-card-content>
      </mat-card>
      
      <!-- Card with image -->
      <mat-card>
        <img mat-card-image src="https://via.placeholder.com/400x200" alt="Placeholder">
        <mat-card-header>
          <mat-card-title>Photo Card</mat-card-title>
          <mat-card-subtitle>Card with image</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <p>Cards can include images to make content more engaging.</p>
        </mat-card-content>
        <mat-card-actions>
          <button mat-button>LIKE</button>
          <button mat-button>SHARE</button>
        </mat-card-actions>
      </mat-card>
      
      <!-- User profile card -->
      @for (user of users(); track user.id) {
        <mat-card>
          <mat-card-header>
            <div mat-card-avatar [style.background-image]="'url(' + user.avatar + ')'"></div>
            <mat-card-title>{{user.name}}</mat-card-title>
            <mat-card-subtitle>{{user.role}}</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <p>{{user.bio}}</p>
          </mat-card-content>
          <mat-card-actions>
            <button mat-button (click)="viewProfile(user)">VIEW PROFILE</button>
            <button mat-button (click)="sendMessage(user)">MESSAGE</button>
          </mat-card-actions>
        </mat-card>
      }
    </div>
  `
})
export class CardDemoComponent {
  users = signal([
    {
      id: 1,
      name: 'John Doe',
      role: 'Software Engineer',
      bio: 'Passionate about creating amazing user experiences with Angular.',
      avatar: 'https://via.placeholder.com/40'
    },
    {
      id: 2,
      name: 'Jane Smith',
      role: 'UX Designer',
      bio: 'Designing intuitive interfaces that users love.',
      avatar: 'https://via.placeholder.com/40'
    }
  ]);

  viewProfile(user: any) {
    console.log('Viewing profile:', user.name);
  }

  sendMessage(user: any) {
    console.log('Sending message to:', user.name);
  }
}
```

### Forms - User Input Made Beautiful

**Material forms are like having a professional interviewer** - they guide users through input smoothly and clearly.

```typescript
@Component({
  selector: 'app-form-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatRadioModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div>
      <h3>Material Form Example</h3>
      
      <form [formGroup]="userForm" (ngSubmit)="onSubmit()">
        <!-- Text inputs -->
        <mat-form-field appearance="outline">
          <mat-label>Full Name</mat-label>
          <input matInput formControlName="name" placeholder="Enter your name">
          <mat-icon matSuffix>person</mat-icon>
          @if (userForm.get('name')?.hasError('required')) {
            <mat-error>Name is required</mat-error>
          }
        </mat-form-field>
        
        <mat-form-field appearance="outline">
          <mat-label>Email</mat-label>
          <input matInput type="email" formControlName="email" placeholder="your@email.com">
          <mat-icon matSuffix>email</mat-icon>
          @if (userForm.get('email')?.hasError('required')) {
            <mat-error>Email is required</mat-error>
          }
          @if (userForm.get('email')?.hasError('email')) {
            <mat-error>Please enter a valid email</mat-error>
          }
        </mat-form-field>
        
        <!-- Select dropdown -->
        <mat-form-field appearance="outline">
          <mat-label>Country</mat-label>
          <mat-select formControlName="country">
            @for (country of countries(); track country.code) {
              <mat-option [value]="country.code">{{country.name}}</mat-option>
            }
          </mat-select>
        </mat-form-field>
        
        <!-- Textarea -->
        <mat-form-field appearance="outline">
          <mat-label>Bio</mat-label>
          <textarea matInput formControlName="bio" rows="4" placeholder="Tell us about yourself"></textarea>
          <mat-hint>{{userForm.get('bio')?.value?.length || 0}}/500 characters</mat-hint>
        </mat-form-field>
        
        <!-- Checkboxes -->
        <div>
          <h4>Interests</h4>
          @for (interest of interests(); track interest.id) {
            <mat-checkbox [formControlName]="'interest_' + interest.id">
              {{interest.name}}
            </mat-checkbox>
          }
        </div>
        
        <!-- Radio buttons -->
        <div>
          <h4>Experience Level</h4>
          <mat-radio-group formControlName="experience">
            <mat-radio-button value="beginner">Beginner</mat-radio-button>
            <mat-radio-button value="intermediate">Intermediate</mat-radio-button>
            <mat-radio-button value="advanced">Advanced</mat-radio-button>
          </mat-radio-group>
        </div>
        
        <!-- Submit button -->
        <div>
          <button mat-raised-button color="primary" type="submit" [disabled]="userForm.invalid">
            <mat-icon>save</mat-icon>
            Save Profile
          </button>
        </div>
      </form>
    </div>
  `
})
export class FormDemoComponent {
  private fb = inject(FormBuilder);

  countries = signal([
    { code: 'US', name: 'United States' },
    { code: 'UK', name: 'United Kingdom' },
    { code: 'CA', name: 'Canada' },
    { code: 'AU', name: 'Australia' }
  ]);

  interests = signal([
    { id: 1, name: 'Web Development' },
    { id: 2, name: 'Mobile Apps' },
    { id: 3, name: 'Data Science' },
    { id: 4, name: 'Design' }
  ]);

  userForm = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    country: [''],
    bio: [''],
    experience: ['intermediate'],
    interest_1: [false],
    interest_2: [false],
    interest_3: [false],
    interest_4: [false]
  });

  onSubmit() {
    if (this.userForm.valid) {
      console.log('Form submitted:', this.userForm.value);
    }
  }
}
```

## 📊 Data Display Components

### Tables - Organizing Information

**Material tables are like having a professional data analyst** - they make complex information easy to scan and understand.

```typescript
@Component({
  selector: 'app-table-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatTableModule, MatSortModule, MatPaginatorModule, MatButtonModule, MatIconModule],
  template: `
    <div>
      <h3>User Management Table</h3>
      
      <mat-table [dataSource]="dataSource()" matSort>
        <!-- ID Column -->
        <ng-container matColumnDef="id">
          <mat-header-cell *matHeaderCellDef mat-sort-header>ID</mat-header-cell>
          <mat-cell *matCellDef="let user">{{user.id}}</mat-cell>
        </ng-container>
        
        <!-- Name Column -->
        <ng-container matColumnDef="name">
          <mat-header-cell *matHeaderCellDef mat-sort-header>Name</mat-header-cell>
          <mat-cell *matCellDef="let user">{{user.name}}</mat-cell>
        </ng-container>
        
        <!-- Email Column -->
        <ng-container matColumnDef="email">
          <mat-header-cell *matHeaderCellDef>Email</mat-header-cell>
          <mat-cell *matCellDef="let user">{{user.email}}</mat-cell>
        </ng-container>
        
        <!-- Role Column -->
        <ng-container matColumnDef="role">
          <mat-header-cell *matHeaderCellDef>Role</mat-header-cell>
          <mat-cell *matCellDef="let user">
            <span [class]="'role-' + user.role.toLowerCase()">{{user.role}}</span>
          </mat-cell>
        </ng-container>
        
        <!-- Actions Column -->
        <ng-container matColumnDef="actions">
          <mat-header-cell *matHeaderCellDef>Actions</mat-header-cell>
          <mat-cell *matCellDef="let user">
            <button mat-icon-button (click)="editUser(user)">
              <mat-icon>edit</mat-icon>
            </button>
            <button mat-icon-button color="warn" (click)="deleteUser(user)">
              <mat-icon>delete</mat-icon>
            </button>
          </mat-cell>
        </ng-container>
        
        <mat-header-row *matHeaderRowDef="displayedColumns()"></mat-header-row>
        <mat-row *matRowDef="let row; columns: displayedColumns()"></mat-row>
      </mat-table>
      
      <mat-paginator [pageSizeOptions]="[5, 10, 20]" showFirstLastButtons></mat-paginator>
    </div>
  `
})
export class TableDemoComponent implements AfterViewInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  displayedColumns = signal(['id', 'name', 'email', 'role', 'actions']);
  
  users = signal([
    { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'User' },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'Editor' },
    { id: 4, name: 'Alice Brown', email: 'alice@example.com', role: 'User' }
  ]);

  dataSource = computed(() => new MatTableDataSource(this.users()));

  ngAfterViewInit() {
    this.dataSource().paginator = this.paginator;
    this.dataSource().sort = this.sort;
  }

  editUser(user: any) {
    console.log('Editing user:', user);
  }

  deleteUser(user: any) {
    console.log('Deleting user:', user);
  }
}
```

## 🎨 Theming and Customization

**Theming is like choosing the personality of your app** - it sets the mood and makes your brand shine through.

```scss
// styles.scss - Global theme setup
@use '@angular/material' as mat;

// Define your custom colors
$my-primary: mat.define-palette(mat.$indigo-palette);
$my-accent: mat.define-palette(mat.$pink-palette, A200, A100, A400);
$my-warn: mat.define-palette(mat.$red-palette);

// Create the theme
$my-theme: mat.define-light-theme((
  color: (
    primary: $my-primary,
    accent: $my-accent,
    warn: $my-warn,
  ),
  typography: mat.define-typography-config(),
  density: 0,
));

// Include theme styles for core and each component used in your app
@include mat.all-component-themes($my-theme);

// Custom component styles
.role-admin {
  color: #4caf50;
  font-weight: bold;
}

.role-user {
  color: #2196f3;
}

.role-editor {
  color: #ff9800;
}
```

### Dynamic Theming with Signals

```typescript
@Component({
  selector: 'app-theme-switcher',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatIconModule, MatSlideToggleModule],
  template: `
    <div>
      <h3>Theme Controls</h3>
      
      <mat-slide-toggle 
        [checked]="isDarkMode()" 
        (change)="toggleTheme()">
        Dark Mode
      </mat-slide-toggle>
      
      <div>
        <h4>Primary Colors</h4>
        @for (color of primaryColors(); track color.name) {
          <button 
            mat-raised-button 
            [style.background-color]="color.value"
            (click)="setPrimaryColor(color)">
            {{color.name}}
          </button>
        }
      </div>
    </div>
  `
})
export class ThemeSwitcherComponent {
  isDarkMode = signal(false);
  
  primaryColors = signal([
    { name: 'Indigo', value: '#3f51b5' },
    { name: 'Purple', value: '#9c27b0' },
    { name: 'Teal', value: '#009688' },
    { name: 'Orange', value: '#ff5722' }
  ]);

  toggleTheme() {
    this.isDarkMode.update(current => !current);
    
    // Apply theme class to body
    const body = document.body;
    if (this.isDarkMode()) {
      body.classList.add('dark-theme');
    } else {
      body.classList.remove('dark-theme');
    }
  }

  setPrimaryColor(color: any) {
    // Update CSS custom properties
    document.documentElement.style.setProperty('--primary-color', color.value);
  }
}
```

## ✅ Best Practices

### 1. **Import Only What You Need**
```typescript
// ✅ Good - Import specific modules
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';

// ❌ Avoid - Importing everything
import * as Material from '@angular/material';
```

### 2. **Use Proper Form Field Appearance**
```typescript
// ✅ Good - Consistent appearance
@Component({
  template: `
    <mat-form-field appearance="outline">
      <mat-label>Name</mat-label>
      <input matInput>
    </mat-form-field>
  `
})
```

### 3. **Leverage Material Icons**
```typescript
// ✅ Good - Semantic icon usage
@Component({
  template: `
    <button mat-raised-button>
      <mat-icon>save</mat-icon>
      Save Document
    </button>
  `
})
```

## 🎯 Quick Checklist

- [ ] Install Angular Material with `ng add @angular/material`
- [ ] Set up animations for smooth interactions
- [ ] Use consistent form field appearances
- [ ] Implement proper error handling in forms
- [ ] Leverage Material icons for better UX
- [ ] Create custom themes for brand consistency
- [ ] Use appropriate component variants (raised, flat, etc.)
- [ ] Implement responsive design with Material breakpoints
- [ ] Test accessibility with screen readers
- [ ] Optimize bundle size by importing only needed modules

## 🚀 Next Steps

1. **[Testing](/intermediate/testing/)** - Testing Material components
2. **[Advanced Theming](/advanced/theming/)** - Complex theme customization
3. **[CDK](/advanced/cdk/)** - Angular Component Dev Kit

---

**Remember**: Angular Material is like having a design system in a box - it gives you professional, accessible components that work beautifully together. Focus on user experience and let Material handle the design details! 🎨
