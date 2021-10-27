import { User } from "../../../generated/model/user";
import { BehaviorSubject, Observable, of } from "rxjs";
import { catchError, finalize } from "rxjs/operators"
import { CollectionViewer, DataSource} from "@angular/cdk/collections";
import { UsersService } from "../../../generated/api/users.service";

export class UsersFacadeService implements DataSource<User> {

    private usersSubject = new BehaviorSubject<User[]>([]);
    private loadingSubject = new BehaviorSubject<boolean>(false);

    public loading$ = this.loadingSubject.asObservable();
    public users$ =  this.usersSubject.asObservable();
    constructor(private userService: UsersService) {

    }

    connect(collectionViewer: CollectionViewer): Observable<User[]> {
        return this.usersSubject.asObservable();
    }
    disconnect(collectionViewer: CollectionViewer): void {
        this.usersSubject.complete();
        this.loadingSubject.complete();
    }

    deleteUser(user: User): void {
        this.loadingSubject.next(true);
        this.userService.deleteUser(''+user.id).pipe(
            catchError(() => of([])),
            finalize(() => this.loadingSubject.next(false))
        )
        .subscribe(users => this.usersSubject.next(users));
    }

    loadUsers() {
        this.loadingSubject.next(true);
        this.userService.getUsers().pipe(
            catchError(() => of([])),
            finalize(() => this.loadingSubject.next(false))
        )
        .subscribe(users => this.usersSubject.next(users));
    }    
}