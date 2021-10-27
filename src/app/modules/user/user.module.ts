import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserComponent } from './user.component';
import { UserRoutingModule } from './user-routing.module';
import { HttpClientModule } from '@angular/common/http';
import { AngularMaterialModule } from '../angular-material.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { DialogBoxComponent } from './dialog-box.component';
import { UsersService } from '../../../generated/api/users.service';

@NgModule({
  declarations: [
    UserComponent,
    DialogBoxComponent
  ],
  imports: [
    CommonModule,
    UserRoutingModule,
    BrowserAnimationsModule,
    HttpClientModule,
    AngularMaterialModule
  ],
  entryComponents: [DialogBoxComponent],
  exports: [UserComponent],
  providers: [UsersService]
})
export class UserModule { }
