import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JoinedMissions } from './joined-missions';

describe('JoinedMissions', () => {
  let component: JoinedMissions;
  let fixture: ComponentFixture<JoinedMissions>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JoinedMissions]
    })
    .compileComponents();

    fixture = TestBed.createComponent(JoinedMissions);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
