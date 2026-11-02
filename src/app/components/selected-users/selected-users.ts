import { Component, input, output } from '@angular/core';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-selected-users',
  standalone: true,
  imports: [],
  styleUrl: './selected-users.scss',
  templateUrl: './selected-users.html',
})
export class SelectedUsersComponent {
  users = input<User[]>([]);
  removeUser = output<string | number>();
}