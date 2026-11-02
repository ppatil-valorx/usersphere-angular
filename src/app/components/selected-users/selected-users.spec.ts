import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SelectedUsers } from './selected-users';

describe('SelectedUsers', () => {
  let component: SelectedUsers;
  let fixture: ComponentFixture<SelectedUsers>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SelectedUsers],
    }).compileComponents();

    fixture = TestBed.createComponent(SelectedUsers);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
