import { TestBed, inject } from '@angular/core/testing';

import { MongoDbService } from './mongo-db.service';

describe('MongoDbService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MongoDbService]
    });
  });

  it('should be created', inject([MongoDbService], (service: MongoDbService) => {
    expect(service).toBeTruthy();
  }));
});
