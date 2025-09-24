---
title: HTTP Client 🌐
description: Learn to communicate with servers using Angular HTTP client
sidebar:
  order: 10
---

The Angular HTTP client enables communication with backend services over HTTP. It provides a powerful API for making requests, handling responses, and managing errors in your Angular applications.

## 🎯 What is Angular HTTP Client?

Angular HTTP Client helps you:
- **Make HTTP requests** (GET, POST, PUT, DELETE)
- **Handle responses** and errors gracefully
- **Transform data** with interceptors
- **Manage loading states** and caching
- **Work with observables** for reactive programming

## 🛠️ Basic Setup

### 1. Import HTTP Client
```typescript
// main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient()
  ]
});
```

### 2. Inject HTTP Client
```typescript
import { Component, inject, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-data',
  imports: [CommonModule],
  template: `
    @if (loading) {
      <div>Loading...</div>
    } @else if (error) {
      <div class="error">{{error}}</div>
    } @else {
      <div>{{data | json}}</div>
    }
  `
})
export class DataComponent implements OnInit {
  private http = inject(HttpClient);
  
  data: any = null;
  loading = false;
  error: string | null = null;

  ngOnInit() {
    this.fetchData();
  }

  fetchData() {
    this.loading = true;
    this.error = null;
    
    this.http.get('https://jsonplaceholder.typicode.com/posts/1')
      .subscribe({
        next: (response) => {
          this.data = response;
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Failed to load data';
          this.loading = false;
        }
      });
  }
}
```

## 🔄 HTTP Methods

### GET Requests
```typescript
// Basic GET
this.http.get('https://api.example.com/users')
  .subscribe(users => console.log(users));

// GET with parameters
this.http.get('https://api.example.com/users', {
  params: {
    page: '1',
    limit: '10',
    sort: 'name'
  }
}).subscribe(response => console.log(response));

// GET with typed response
interface User {
  id: number;
  name: string;
  email: string;
}

this.http.get<User[]>('https://api.example.com/users')
  .subscribe(users => {
    // users is now typed as User[]
    console.log(users[0].name);
  });
```

### POST Requests
```typescript
// Basic POST
const newUser = { name: 'John Doe', email: 'john@example.com' };

this.http.post('https://api.example.com/users', newUser)
  .subscribe(response => console.log('User created:', response));

// POST with headers
this.http.post('https://api.example.com/users', newUser, {
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  }
}).subscribe(response => console.log(response));

// POST with typed response
this.http.post<User>('https://api.example.com/users', newUser)
  .subscribe(user => console.log('Created user:', user.id));
```

### PUT and PATCH Requests
```typescript
// PUT (full update)
const updatedUser = { id: 1, name: 'Jane Doe', email: 'jane@example.com' };

this.http.put(`https://api.example.com/users/${updatedUser.id}`, updatedUser)
  .subscribe(response => console.log('User updated:', response));

// PATCH (partial update)
const partialUpdate = { name: 'Jane Smith' };

this.http.patch(`https://api.example.com/users/1`, partialUpdate)
  .subscribe(response => console.log('User patched:', response));
```

### DELETE Requests
```typescript
// Basic DELETE
this.http.delete('https://api.example.com/users/1')
  .subscribe(() => console.log('User deleted'));

// DELETE with response
this.http.delete<{message: string}>('https://api.example.com/users/1')
  .subscribe(response => console.log(response.message));
```

## 🏗️ Creating a Data Service

```typescript
// user.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);
  private apiUrl = 'https://jsonplaceholder.typicode.com/users';
  
  // State management
  private usersSubject = new BehaviorSubject<User[]>([]);
  users$ = this.usersSubject.asObservable();

  // Get all users
  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl).pipe(
      tap(users => this.usersSubject.next(users)),
      catchError(this.handleError)
    );
  }

  // Get user by ID
  getUserById(id: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  // Create new user
  createUser(user: Omit<User, 'id'>): Observable<User> {
    return this.http.post<User>(this.apiUrl, user).pipe(
      tap(newUser => {
        const currentUsers = this.usersSubject.value;
        this.usersSubject.next([...currentUsers, newUser]);
      }),
      catchError(this.handleError)
    );
  }

  // Update user
  updateUser(user: User): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/${user.id}`, user).pipe(
      tap(updatedUser => {
        const currentUsers = this.usersSubject.value;
        const index = currentUsers.findIndex(u => u.id === updatedUser.id);
        if (index !== -1) {
          currentUsers[index] = updatedUser;
          this.usersSubject.next([...currentUsers]);
        }
      }),
      catchError(this.handleError)
    );
  }

  // Delete user
  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        const currentUsers = this.usersSubject.value;
        const filteredUsers = currentUsers.filter(u => u.id !== id);
        this.usersSubject.next(filteredUsers);
      }),
      catchError(this.handleError)
    );
  }

  // Search users
  searchUsers(query: string): Observable<User[]> {
    const params = new HttpParams().set('q', query);
    
    return this.http.get<User[]>(`${this.apiUrl}/search`, { params }).pipe(
      catchError(this.handleError)
    );
  }

  private handleError = (error: any): Observable<never> => {
    console.error('HTTP Error:', error);
    throw error;
  };
}
```

## 🎨 Practical Example: User Management

```typescript
// user-list.component.ts
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService, User } from './user.service';

@Component({
  selector: 'app-user-list',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="user-management">
      <h2>User Management</h2>
      
      <!-- Add User Form -->
      <div class="add-user-form">
        <h3>Add New User</h3>
        <form (ngSubmit)="addUser()" #userForm="ngForm">
          <input 
            type="text" 
            [(ngModel)]="newUser.name" 
            name="name"
            placeholder="Name" 
            required>
          <input 
            type="email" 
            [(ngModel)]="newUser.email" 
            name="email"
            placeholder="Email" 
            required>
          <input 
            type="tel" 
            [(ngModel)]="newUser.phone" 
            name="phone"
            placeholder="Phone">
          <button type="submit" [disabled]="userForm.invalid || isLoading">
            {{isLoading ? 'Adding...' : 'Add User'}}
          </button>
        </form>
      </div>

      <!-- Search -->
      <div class="search">
        <input 
          type="text" 
          [(ngModel)]="searchQuery"
          (input)="onSearch()"
          placeholder="Search users...">
      </div>

      <!-- Loading State -->
      @if (isLoading && users.length === 0) {
        <div class="loading">Loading users...</div>
      }

      <!-- Error State -->
      @if (error) {
        <div class="error">
          {{error}}
          <button (click)="loadUsers()">Retry</button>
        </div>
      }

      <!-- Users List -->
      @if (users.length > 0) {
        <div class="users-grid">
          @for (user of users; track user.id) {
            <div class="user-card">
              <div class="user-info">
                <h4>{{user.name}}</h4>
                <p>{{user.email}}</p>
                @if (user.phone) {
                  <p>{{user.phone}}</p>
                }
              </div>
              <div class="user-actions">
                <button (click)="editUser(user)" class="edit-btn">Edit</button>
                <button (click)="deleteUser(user.id)" class="delete-btn">Delete</button>
              </div>
            </div>
          }
        </div>
      } @else if (!isLoading) {
        <div class="empty-state">
          <p>No users found</p>
        </div>
      }

      <!-- Edit Modal -->
      @if (editingUser) {
        <div class="modal-overlay" (click)="cancelEdit()">
          <div class="modal" (click)="$event.stopPropagation()">
            <h3>Edit User</h3>
            <form (ngSubmit)="updateUser()">
              <input 
                type="text" 
                [(ngModel)]="editingUser.name" 
                name="editName"
                placeholder="Name" 
                required>
              <input 
                type="email" 
                [(ngModel)]="editingUser.email" 
                name="editEmail"
                placeholder="Email" 
                required>
              <input 
                type="tel" 
                [(ngModel)]="editingUser.phone" 
                name="editPhone"
                placeholder="Phone">
              <div class="modal-actions">
                <button type="submit" [disabled]="isLoading">
                  {{isLoading ? 'Updating...' : 'Update'}}
                </button>
                <button type="button" (click)="cancelEdit()">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `
})
export class UserListComponent implements OnInit {
  private userService = inject(UserService);
  
  users: User[] = [];
  newUser: Omit<User, 'id'> = { name: '', email: '', phone: '' };
  editingUser: User | null = null;
  searchQuery = '';
  isLoading = false;
  error: string | null = null;

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.isLoading = true;
    this.error = null;
    
    this.userService.getUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Failed to load users';
        this.isLoading = false;
      }
    });
  }

  addUser() {
    if (!this.newUser.name || !this.newUser.email) return;
    
    this.isLoading = true;
    
    this.userService.createUser(this.newUser).subscribe({
      next: (user) => {
        this.users.push(user);
        this.newUser = { name: '', email: '', phone: '' };
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Failed to add user';
        this.isLoading = false;
      }
    });
  }

  editUser(user: User) {
    this.editingUser = { ...user };
  }

  updateUser() {
    if (!this.editingUser) return;
    
    this.isLoading = true;
    
    this.userService.updateUser(this.editingUser).subscribe({
      next: (updatedUser) => {
        const index = this.users.findIndex(u => u.id === updatedUser.id);
        if (index !== -1) {
          this.users[index] = updatedUser;
        }
        this.editingUser = null;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Failed to update user';
        this.isLoading = false;
      }
    });
  }

  deleteUser(id: number) {
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    this.userService.deleteUser(id).subscribe({
      next: () => {
        this.users = this.users.filter(u => u.id !== id);
      },
      error: (err) => {
        this.error = 'Failed to delete user';
      }
    });
  }

  onSearch() {
    if (this.searchQuery.trim()) {
      this.userService.searchUsers(this.searchQuery).subscribe({
        next: (users) => {
          this.users = users;
        },
        error: (err) => {
          this.error = 'Search failed';
        }
      });
    } else {
      this.loadUsers();
    }
  }

  cancelEdit() {
    this.editingUser = null;
  }
}
```

## 🛡️ Error Handling

```typescript
// error-handler.service.ts
import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ErrorHandlerService {
  
  handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Client Error: ${error.error.message}`;
    } else {
      // Server-side error
      switch (error.status) {
        case 400:
          errorMessage = 'Bad Request: Please check your input';
          break;
        case 401:
          errorMessage = 'Unauthorized: Please log in';
          break;
        case 403:
          errorMessage = 'Forbidden: You don\'t have permission';
          break;
        case 404:
          errorMessage = 'Not Found: Resource doesn\'t exist';
          break;
        case 500:
          errorMessage = 'Server Error: Please try again later';
          break;
        default:
          errorMessage = `Server Error: ${error.status} - ${error.message}`;
      }
    }
    
    console.error('HTTP Error:', error);
    return throwError(() => new Error(errorMessage));
  }
}
```

## ✅ Best Practices

### 1. **Use Typed Interfaces**
```typescript
// ✅ Type your responses
interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

this.http.get<ApiResponse<User[]>>('/api/users')
  .subscribe(response => {
    // response.data is typed as User[]
  });
```

### 2. **Handle Loading States**
```typescript
// ✅ Always show loading states
@Component({
  template: `
    @if (loading) {
      <div class="spinner">Loading...</div>
    } @else {
      <div>{{data | json}}</div>
    }
  `
})
```

### 3. **Use Services for HTTP Calls**
```typescript
// ✅ Centralize HTTP logic in services
@Injectable()
export class DataService {
  private http = inject(HttpClient);
  
  getData() {
    return this.http.get('/api/data');
  }
}
```

### 4. **Implement Proper Error Handling**
```typescript
// ✅ Handle errors gracefully
this.http.get('/api/data').pipe(
  catchError(error => {
    console.error('Error:', error);
    return of([]); // Return fallback data
  })
).subscribe(data => {
  // Handle success or fallback
});
```

### 5. **Use Interceptors for Common Logic**
```typescript
// ✅ Add auth tokens automatically
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler) {
    const authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${this.getToken()}`
      }
    });
    return next.handle(authReq);
  }
}
```

## 🎯 Quick Checklist

- [ ] Import `provideHttpClient()` in bootstrap
- [ ] Inject `HttpClient` in services
- [ ] Use typed interfaces for responses
- [ ] Handle loading and error states
- [ ] Implement proper error handling
- [ ] Use services for HTTP operations
- [ ] Add request/response interceptors
- [ ] Handle authentication tokens
- [ ] Implement retry logic for failed requests
- [ ] Use observables properly with async pipe

## 🚀 Next Steps

1. **[Reactive Forms](/intermediate/reactive-forms/)** - Advanced form handling with HTTP
2. **[State Management](/intermediate/state-management/)** - Manage HTTP data across components
3. **[Testing](/testing/service-testing/)** - Test HTTP services and components

---

**Remember**: HTTP communication is the backbone of modern web applications. Always handle errors gracefully, provide loading states, and keep your users informed! 🌐
