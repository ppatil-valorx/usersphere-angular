import {
  Component,
  DestroyRef,
  OnChanges,
  SimpleChanges,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { AsyncPipe } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  Observable,
  Subject,
  catchError,
  map,
  of,
  startWith,
  switchMap,
  tap,
} from 'rxjs';

import { UserService } from '../../services/user';
import { User } from '../../models/user.model';

interface DetailsState {
  user: User | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
  success: string | null;
}

type DetailsAction =
  | { type: 'load' }
  | { type: 'save'; user: User };

@Component({
  selector: 'app-user-details',
  standalone: true,
  imports: [AsyncPipe, ReactiveFormsModule],
  templateUrl: './user-details.html',
  styleUrl: './user-details.scss',
})
export class UserDetailsComponent implements OnChanges {
  private readonly userService = inject(UserService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

userId = input<string | number | null>(null);
  userUpdated = output<User>();

  isEditing = signal(false);

  private readonly actions$ = new Subject<DetailsAction>();

  readonly userForm = this.formBuilder.nonNullable.group({
    name: ['', Validators.required],
    username: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    website: [''],
  });

  private readonly initialState: DetailsState = {
    user: null,
    loading: true,
    saving: false,
    error: null,
    success: null,
  };

  readonly state$: Observable<DetailsState> = this.actions$.pipe(
    startWith({ type: 'load' } as DetailsAction),

    switchMap((action): Observable<DetailsState> => {
      if (action.type === 'load') {
        const id = this.userId();

        if (id === null) {
          return of({
            user: null,
            loading: false,
            saving: false,
            error: null,
            success: null,
          });
        }

        return this.userService.getUserById(id).pipe(
          tap((user) => this.populateForm(user)),
          map((user) => ({
            user,
            loading: false,
            saving: false,
            error: null,
            success: null,
          })),
          startWith({
            user: null,
            loading: true,
            saving: false,
            error: null,
            success: null,
          }),
          catchError((error) => {
            console.error('Failed to load user details:', error);

            return of({
              user: null,
              loading: false,
              saving: false,
              error: 'Unable to load user details. Please try again.',
              success: null,
            });
          }),
        );
      }

      return this.userService
        .updateUser(action.user.id, {
          name: action.user.name,
          username: action.user.username,
          email: action.user.email,
          phone: action.user.phone,
          website: action.user.website,
        })
        .pipe(
          map((response) => {
            // Keep submitted values if the API returns only part
            // of the updated user.
            const savedUser: User = {
              ...action.user,
              ...response,
            };

            return savedUser;
          }),
          tap((savedUser) => {
            this.populateForm(savedUser);
            this.isEditing.set(false);
            this.userUpdated.emit(savedUser);
          }),
          map((savedUser) => ({
            user: savedUser,
            loading: false,
            saving: false,
            error: null,
            success: 'User updated successfully!',
          })),
          startWith({
            user: action.user,
            loading: false,
            saving: true,
            error: null,
            success: null,
          }),
          catchError((error) => {
            console.error('Failed to update user:', error);

            return of({
              user: action.user,
              loading: false,
              saving: false,
              error: 'Unable to save changes. Please try again.',
              success: null,
            });
          }),
        );
    }),

    takeUntilDestroyed(this.destroyRef),
  );

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['userId']) {
      this.isEditing.set(false);
      this.actions$.next({ type: 'load' });
    }
  }

  private populateForm(user: User): void {
    this.userForm.reset({
      name: user.name ?? '',
      username: user.username ?? '',
      email: user.email ?? '',
      phone: user.phone ?? '',
      website: user.website ?? '',
    });
  }

  startEditing(user: User): void {
    this.populateForm(user);
    this.isEditing.set(true);
  }

  cancelEditing(user: User): void {
    this.populateForm(user);
    this.isEditing.set(false);
  }

  saveUser(user: User): void {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    const formValue = this.userForm.getRawValue();

    const updatedUser: User = {
      ...user,
      ...formValue,
    };

    this.actions$.next({
      type: 'save',
      user: updatedUser,
    });
  }
}