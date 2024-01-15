import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import { AuthService } from './shared';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  constructor(private authService: AuthService, private translate: TranslateService) {}

  ngOnInit() {
    this.authService.loadMe();
    // TODO: Get language from user settings.
    const browserLang = this.translate.getBrowserLang().toLowerCase();
    const lang = ['de', 'en'].includes(browserLang) ? browserLang : 'en';
    this.translate.use(lang);
  }
}
