import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UserDirectory } from './user-directory';

describe('UserDirectory', () => {
  let component: UserDirectory;
  let fixture: ComponentFixture<UserDirectory>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserDirectory],
    }).compileComponents();

    fixture = TestBed.createComponent(UserDirectory);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
