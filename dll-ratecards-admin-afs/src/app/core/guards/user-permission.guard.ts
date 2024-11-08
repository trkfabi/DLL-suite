import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { doLog } from '../app-settings';
import { AuthService } from '../services';

const LOG_TAG = '[core/guards/UserPermissionGuard]';

@Injectable({
	providedIn: 'root',
})
export class UserPermissionGuard implements CanActivate {
	constructor(private _auth: AuthService, private _router: Router) {}

	canActivate(route: ActivatedRouteSnapshot) {
		doLog && console.log(LOG_TAG, '- canActivate');
		const permission = this._auth.getUserPermissions();
		if (route.data.permission !== permission) {
			const validPath = `/${permission}/dashboard`;
			this._router.navigate([validPath]);
		}
		return true;
	}
}
