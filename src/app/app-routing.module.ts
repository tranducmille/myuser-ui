import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

const userRoutes: Routes = [
    {
      path: 'users',
      loadChildren: () => import('./modules/user/user.module').then(m => m.UserModule)
    },
    {
      path: '',
      redirectTo: '',
      pathMatch: 'full'
    }
];

@NgModule({
    imports: [RouterModule.forChild(userRoutes)],
    exports: [RouterModule]
  })
  export class AppRoutingModule { }