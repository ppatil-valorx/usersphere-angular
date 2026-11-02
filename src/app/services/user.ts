import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User as UserModel } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  //private apiUrl = 'https://jsonplaceholder.typicode.com/users';
// private readonly apiUrl =
//   'https://caf16ab280b94714e3e5.free.beeceptor.com/api/users';
private readonly apiUrl = 'http://localhost:3000/users';
  
  constructor(private http: HttpClient) {}

  getUsers(): Observable<UserModel[]> {
  return this.http.get<UserModel[]>(this.apiUrl);
}

 // READ: Fetch a single user by ID
  getUserById(id: number | string): Observable<UserModel> {
    return this.http.get<UserModel>(`${this.apiUrl}/${id}`);
  }


searchUsers(username: string): Observable<UserModel[]> {
  return this.http.get<UserModel[]>(this.apiUrl, {
    params: { username }
  });
}

 // CREATE: Add a new user
  createUser(user: Omit<UserModel, 'id'>): Observable<UserModel> {
    return this.http.post<UserModel>(this.apiUrl, user);
  }

   // UPDATE: Replace an existing user
  replaceUser(
    id: number | string,
    user: Partial<UserModel>
  ): Observable<UserModel> {
    return this.http.put<UserModel>(`${this.apiUrl}/${id}`, user);
  }


updateUser(
  id: number,
  updatedData: Partial<UserModel>
): Observable<UserModel> {
  return this.http.patch<UserModel>(
    `${this.apiUrl}/${id}`,
    updatedData
  );
}

 // DELETE: Remove a user
  deleteUser(id: number | string): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(
      `${this.apiUrl}/${id}`
    );
  }
}