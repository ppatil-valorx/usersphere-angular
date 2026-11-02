import { Component, OnInit, signal, OnDestroy, inject, DestroyRef } from '@angular/core';
import { BehaviorSubject,
  Subject,
  Observable,
  of,
  combineLatest,forkJoin} from 'rxjs';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  finalize,
  takeUntil,
  map,
  startWith,
  tap,
  switchMap
} from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
export class UserDirectoryComponent implements OnInit {
  private readonly userService = inject(UserService);
private readonly destroyRef = inject(DestroyRef);
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

private readonly usernameSubject = new Subject<string>();

readonly username$ = this.usernameSubject.asObservable();
readonly filteredUsers$: Observable<User[]> = this.username$.pipe(
  startWith(''),
  debounceTime(300),
  distinctUntilChanged(),

  switchMap(username => {
    const term = username.trim();

    const request$ = term
      ? this.userService.searchUsers(term)
      : this.userService.getUsers();

    return request$.pipe(
      catchError(error => {
        console.error('Failed to search users:', error);

        this.errorMessage.set(
          'Unable to search users. Please try again.'
        );

        return of([] as User[]);
      }),

      tap(() => this.errorMessage.set(null))
    );
  })
);
  selectedUsers = signal<User[]>([]);
  loading = signal<boolean>(true);
  errorMessage = signal<string | null>(null);
selectedUserId = signal<string | number | null>(null);
  ngOnInit(): void {
    this.loadUsers();
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
  takeUntilDestroyed(this.destroyRef),
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
  takeUntilDestroyed(this.destroyRef),
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
  onSearch(username: string): void {
  this.usernameSubject.next(username);
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

  // Prevent selecting the same user twice.
  if (selected.some((item) => String(item.id) === String(user.id))) {
    return;
  }

  // Allow a maximum of 5 users.
  if (selected.length >= 5) {
    alert('You can select a maximum of 5 users.');
    return;
  }

  // Create the list of users we want to select.
  const usersToSelect = [...selected, user];

  // Fetch the details of every selected user.
  const requests = usersToSelect.map((selectedUser) =>
    this.userService.getUserById(selectedUser.id)
  );

  // Clear the current selection while the requests are pending.
  this.selectedUsers.set([]);

  forkJoin(requests)
    .pipe(
      catchError((error) => {
        console.error('Failed to fetch selected users:', error);

        this.errorMessage.set(
          'Unable to load selected users. Please try again.'
        );

        return of(null);
      }),
  takeUntilDestroyed(this.destroyRef),
    )
    .subscribe((users) => {
      if (users === null) {
        return;
      }

      // Update the selection only after every request succeeds.
      this.selectedUsers.set(users);
      this.errorMessage.set(null);
    });
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
  takeUntilDestroyed(this.destroyRef),
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