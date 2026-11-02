import { Component, output } from '@angular/core';

@Component({
  selector: 'app-user-search',
  standalone: true,
  imports: [],
  templateUrl: './user-search.html',
  styleUrl: './user-search.scss',
})
export class UserSearch {
  searchChange = output<string>();

  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchChange.emit(input.value);
  }
}