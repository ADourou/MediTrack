import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ItemShopComponent } from './pages/item-shop/item-shop.component';
import { MobileComponent } from './pages/mobile/mobile.component';

const routes: Routes = [
  { 
    path: 'home', 
    loadChildren: () => import('./pages/home/home.module').then(m => m.HomeModule) 
  },

  { path: 'mobile/:id', component: MobileComponent },

  { path: 'item-shop', component: ItemShopComponent},
  
  // default tablet/eleni
  { path: '', redirectTo: 'home/eleni', pathMatch: 'full' },
  { path: '**', redirectTo: 'home/eleni' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }