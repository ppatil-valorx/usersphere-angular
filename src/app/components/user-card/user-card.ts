import { Component, input, output } from '@angular/core';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-user-card',
  standalone: true,
  imports: [],
  templateUrl: './user-card.html',
  styleUrl: './user-card.scss'
})
export class UserCardComponent {
  user = input.required<User>();
  selected = input<boolean>(false);
  selectionDisabled = input<boolean>(false);

  selectUser = output<User>();
  viewDetails = output<number>();

  onSelect(): void {
    this.selectUser.emit(this.user());
  }

  onViewDetails(): void {
    this.viewDetails.emit(this.user().id);
  }

  deleteUser = output<string | number>();

onDelete(): void {
  const confirmed = confirm(
    `Are you sure you want to delete ${this.user().name}?`
  );

  if (confirmed) {
    this.deleteUser.emit(this.user().id);
  }
}
}