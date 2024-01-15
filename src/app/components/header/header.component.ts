import { DOCUMENT } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { AuthService } from 'src/app/shared/services/auth.service';
import { environment } from 'src/environments/environment';
@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent {
  get showRoleDropdown() {
    return environment.production !== true;
  }

  get logoutUrl() {
    return new URL(
      '/auth/realms/BMWAIQX/protocol/openid-connect/logout?redirect_uri=' +
        encodeURIComponent(new URL('/oauth2/sign_out', window.location.origin).href),
      window.location.origin,
    ).href;
  }

  constructor(public authService: AuthService, @Inject(DOCUMENT) private document: Document) {}

  switchToRequestor() {
    this.authService.role = 'REQUESTOR';
    this.reloadPage();
  }

  switchToAiqxTeam() {
    this.authService.role = 'AIQX_TEAM';
    this.reloadPage();
  }
  private reloadPage() {
    (this.document.defaultView || window).location.reload();
  }
}
