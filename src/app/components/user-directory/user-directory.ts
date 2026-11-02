import { Component, OnInit, signal, OnDestroy, inject } from '@angular/core';
import { BehaviorSubject,
  Subject,
  Observable,
  of,
  combineLatest,} from 'rxjs';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  finalize,
  takeUntil,
  map,
  startWith,
  tap,
} from 'rxjs/operators';
import { AsyncPipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { UserCardComponent } from '../user-card/user-card';
import { UserSearch } from '../user-search/user-search';
import { UserService } from '../../services/user';
import { User } from '../../models/user.model';
import { UserDetailsComponent } from '../user-details/user-details';
import { SelectedUsersComponent } from '../selected-users/selected-users';






@Component({
  selector: 'app-user-directory',
  standalone: true,
  imports: [UserCardComponent, UserSearch, UserDetailsComponent, SelectedUsersComponent, ReactiveFormsModule, AsyncPipe],
  templateUrl: './user-directory.html',
  styleUrl: './user-directory.scss',
})
export class UserDirectoryComponent implements OnInit, OnDestroy {
  private readonly userService = inject(UserService);
  private readonly destroy$ = new Subject<void>();

  private readonly formBuilder = inject(FormBuilder);

showCreateForm = signal(false);
creatingUser = signal(false);
createSuccess = signal<string | null>(null);
createError = signal<string | null>(null);

readonly createUserForm = this.formBuilder.nonNullable.group({
  name: ['', Validators.required],
  username: ['', Validators.required],
  email: ['', [Validators.required, Validators.email]],
  phone: [''],
  website: ['']
});

  private readonly usersSubject = new BehaviorSubject<User[]>([]);

readonly users$ = this.usersSubject.asObservable();

private readonly searchTermSubject = new Subject<string>();

readonly filteredUsers$: Observable<User[]> = combineLatest([
  this.users$,
  this.searchTermSubject.pipe(
    startWith(''),
    debounceTime(300),
    distinctUntilChanged(),
  ),
]).pipe(
  map(([users, searchTerm]) => {
    const term = searchTerm.trim().toLowerCase();

    if (!term) {
      return users;
    }

    return users.filter(
      user =>
        user.name.toLowerCase().includes(term) ||
        user.username.toLowerCase().includes(term),
    );
  }),
);
  selectedUsers = signal<User[]>([]);
  loading = signal<boolean>(true);
  errorMessage = signal<string | null>(null);
selectedUserId = signal<string | number | null>(null);
  ngOnInit(): void {
    this.loadUsers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

 private loadUsers(): void {
  this.loading.set(true);
  this.errorMessage.set(null);

  this.userService
    .getUsers()
    .pipe(
      tap(users => this.usersSubject.next(users)),
      catchError(error => {
        console.error('Failed to fetch users:', error);

        this.errorMessage.set(
          'Unable to load users. Please try again.',
        );

        return of([] as User[]);
      }),
      finalize(() => this.loading.set(false)),
      takeUntil(this.destroy$),
    )
    .subscribe();
}

  openCreateForm(): void {
  this.createUserForm.reset({
    name: '',
    username: '',
    email: '',
    phone: '',
    website: ''
  });

  this.createSuccess.set(null);
  this.createError.set(null);
  this.showCreateForm.set(true);
}


createUser(): void {
  if (this.createUserForm.invalid) {
    this.createUserForm.markAllAsTouched();
    return;
  }

  this.creatingUser.set(true);
  this.createError.set(null);
  this.createSuccess.set(null);

  const newUser = this.createUserForm.getRawValue();

  this.userService.createUser(newUser)
    .pipe(
      catchError((error) => {
        console.error('Failed to create user:', error);
        this.createError.set('Unable to create user. Please try again.');
        return of(null);
      }),
      finalize(() => this.creatingUser.set(false)),
      takeUntil(this.destroy$)
    )
    .subscribe((createdUser) => {
      if (!createdUser) {
        return;
      }

      this.usersSubject.next([
  ...this.usersSubject.value,
  createdUser,
]);

      this.createSuccess.set('User created successfully!');
      this.showCreateForm.set(false);
      this.createUserForm.reset();
    });
}

cancelCreateForm(): void {
  this.showCreateForm.set(false);
  this.createError.set(null);
  this.createSuccess.set(null);
}
  onSearch(term: string): void {
  this.searchTermSubject.next(term);
}

  // private setupSearch(): void {
  //   this.searchTerms$
  //     .pipe(
  //       debounceTime(300),
  //       distinctUntilChanged(),
  //       takeUntil(this.destroy$),
  //     )
  //     .subscribe((searchTerm) => {
  //       const term = searchTerm.trim().toLowerCase();

  //       const filtered = this.users().filter(
  //         (user) =>
  //           user.name.toLowerCase().includes(term) ||
  //           user.username.toLowerCase().includes(term),
  //       );

  //       this.filteredUsers.set(filtered);
  //     });
  // }

  selectUser(user: User): void {
    const selected = this.selectedUsers();

    if (selected.some((item) => item.id === user.id)) {
      return;
    }

    if (selected.length >= 5) {
      alert('You can select a maximum of 5 users.');
      return;
    }

    this.selectedUsers.update((current) => [...current, user]);
  }

  removeUser(userId: string | number): void {
  this.selectedUsers.update((current) =>
    current.filter((user) => String(user.id) !== String(userId)),
  );
}

  isSelected(userId: string | number): boolean {
  return this.selectedUsers().some(
    (user) => String(user.id) === String(userId),
  );
}

  // viewUserDetails(userId: number): void {
  //   // Details will be connected to UserDetailsComponent next.
  //   console.log('Selected user ID:', userId);
  // }

  viewUserDetails(userId: string | number): void {
  console.log('View Details clicked. User ID:', userId);
  this.selectedUserId.set(userId);
}

  onUserSelected(user: User): void {
    this.selectUser(user);
  }

  onUserDetailsRequested(userId: number): void {
    this.viewUserDetails(userId);
  }

  onUserUpdated(updatedUser: User): void {
  this.usersSubject.next(
    this.usersSubject.value.map(user =>
      String(user.id) === String(updatedUser.id)
        ? updatedUser
        : user,
    ),
  );

  this.selectedUsers.update(users =>
    users.map(user =>
      String(user.id) === String(updatedUser.id)
        ? updatedUser
        : user,
    ),
  );
}

deleteUser(userId: string | number): void {
  const userExists = this.usersSubject.value.some(
    user => String(user.id) === String(userId),
  );

  if (!userExists) {
    return;
  }

  this.userService
    .deleteUser(userId)
    .pipe(
      catchError(error => {
        console.error('Failed to delete user:', error);
        this.errorMessage.set(
          'Unable to delete user. Please try again.',
        );
        return of(null);
      }),
      takeUntil(this.destroy$),
    )
    .subscribe(result => {
      if (result === null) {
        return;
      }

      this.usersSubject.next(
        this.usersSubject.value.filter(
          user => String(user.id) !== String(userId),
        ),
      );

      this.selectedUsers.update(users =>
        users.filter(
          user => String(user.id) !== String(userId),
        ),
      );

      if (String(this.selectedUserId()) === String(userId)) {
        this.selectedUserId.set(null);
      }
    });
}
}