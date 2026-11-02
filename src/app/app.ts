
import { Component, signal } from '@angular/core';
import { SidebarComponent } from './components/sidebar/sidebar';
import { HeaderComponent } from './components/header/header';
import { UserDirectoryComponent } from './components/user-directory/user-directory';
import { SelectedUsersComponent } from './components/selected-users/selected-users';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    SidebarComponent,
    HeaderComponent,
    UserDirectoryComponent,
    SelectedUsersComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('usersphere');
}
