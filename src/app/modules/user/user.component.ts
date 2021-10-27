import { Component, ViewChild, OnInit } from '@angular/core';
import { MatTable } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { UsersService } from "../../../generated/api/users.service";
import { DialogBoxComponent } from './dialog-box.component';
import { UsersFacadeService } from './user-facade.service';

declare const Liferay: any;
@Component({
    selector: 'app-user-component',
	templateUrl: 
		Liferay.ThemeDisplay.getPathContext() + 
		'/o/myuser-ui/app/user/user.component.html'
})
export class UserComponent implements OnInit {

	displayedColumns = ["seqNo", "accountName", "address", "action"];
	dataSource : UsersFacadeService;
	@ViewChild(MatTable,{static:true}) table: MatTable<any>;

	constructor(public dialog: MatDialog, public userService : UsersService) { }

	ngOnInit() {
		this.dataSource  = new UsersFacadeService(this.userService);
		this.dataSource .loadUsers();		
	}		
	
	get loading$() {
		return this.dataSource.loading$;
	}

	onRowClicked(row: any) {
		console.log('Row clicked: ', row);
	}

	openDialog(action: any, obj: any) {
		obj.action = action;
		const dialogRef = this.dialog.open(DialogBoxComponent, {
			width: '250px',
			data: obj
		});
		dialogRef.afterClosed().subscribe(result => {
			delete result.data.action;
			if(result.event == 'Add'){
				this.addRowData(result.data);
			}else if(result.event == 'Update'){
				this.updateRowData(result.data);
			}else if(result.event == 'Delete'){
				this.deleteRowData(result.data);
			}
		});
	}
	
	addRowData(row_obj: any){}
	updateRowData(row_obj: any){}
	deleteRowData(row_obj: any){
		this.dataSource.deleteUser(row_obj);	
	}
}
