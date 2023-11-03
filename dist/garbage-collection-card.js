class GarbageCollectionCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  _label(label, fallback = 'unknown') {
    const lang = this.myhass.selectedLanguage || this.myhass.language;
    const resources = this.myhass.resources[lang];
    return resources && resources[label] ? resources[label] : fallback;
  }

  _getAttributes(hass, entity_id) {
    let alerted = '';
    let date_option = { year: 'numeric', month: '2-digit', day: '2-digit' };
    let date_tmp = '';
    let days = '';
    let ddiff = 0;
    let dow = '';
    let entityState = hass.states[entity_id];
    let friendly_name = '';
    let icon = '';
    let last_collection = null;
    let next_date = '';
    let tmp_date = '';

    if (entityState && this.source != undefined) {
      friendly_name = entityState.attributes['friendly_name'];
      icon = entityState.attributes['icon'];
      if (this.source === "Garbage-Collection" && entityState.attributes['next_date']) {
        date_tmp = new Date(entityState.attributes['next_date']);
        next_date = new Intl.DateTimeFormat(this.llocale, date_option).format(
          date_tmp
        );
        dow = date_tmp.toLocaleString(this.llocale, {weekday: this._config.dow_format})

        days = entityState.attributes['days'];
        alerted = days < 1 ? 'alerted' : days < 2 ? 'alerted_1' : '';
        last_collection = entityState.attributes['last_collection'];

      } else if (this.source === "hacs_waste_collection_schedule") {
        days = entityState.state;

        alerted = days < 1 ? 'alerted' : days < 2 ? 'alerted_1' : '';
        var today = new Date()
        for (var k=0; k < entityState.attributes.upcoming.length; k++) {
          tmp_date = new Date(entityState.attributes.upcoming[k].date);
          ddiff = (tmp_date - today) / (1000 * 3600 * 24) + 1 | 0;
          if( ddiff == days ) {
            date_tmp = new Date(entityState.attributes.upcoming[k].date);
            friendly_name = entityState.attributes.upcoming[k].type;
            break;
          }
        }
        next_date = new Intl.DateTimeFormat(this.llocale, date_option).format(
          date_tmp
        );
        dow = date_tmp.toLocaleString(this.llocale, {weekday: this._config.dow_format})
      }
    }
    return {
      friendly_name: friendly_name,
      next_date: next_date,
      days: days,
      daysstr: days,
      icon: icon,
      alerted: alerted,
      last_collection: last_collection,
      dow: dow,
    };
  }

  setConfig(config) {
    if (!config.entity) {
      throw new Error('Please define an entity');
    }

    const root = this.shadowRoot;
    if (root.lastChild) root.removeChild(root.lastChild);

    const defaultConfig = {
      due_color: 'var(--paper-item-icon-active-color)',
      due_1_color: 'var(--paper-item-icon-active-color)',
      due_txt: false,
      icon_color: 'var(--paper-item-icon-color)',
      icon_size: '25px',
      icon_cell_padding: '35px',
      icon_cell_width: '60px',
      hass_lang_priority: false,
      hide_date: false,
      hide_days: false,
      hide_before: -1,
      hide_on_click: true,
      hide_icon: false,
      hide_title: false,
      title_size: '17px',
      details_size: '14px',
      hide_on_today: false,
      hide_dow: true,
      dow_format: 'long',
      source: 'Garbage-Collection'
    };

    const cardConfig = {
      ...defaultConfig,
      ...config,
    };

    const card = document.createElement('ha-card');
    card.id = 'ha_card';
    this.content = document.createElement('div');
    const style = document.createElement('style');

    style.textContent = `
      table {
        width: 100%;
      }
      td {
        font-size: 120%;
      }
      .tdicon {
        padding-left: ${cardConfig.icon_cell_padding};
        width: ${cardConfig.icon_cell_width};
      }
      ha-icon-button {
        color: ${cardConfig.icon_color};
        --mdc-icon-size: ${cardConfig.icon_size};
      }
      .alerted {
        color: ${cardConfig.due_color};
      }
      .alerted_1 {
        color: ${cardConfig.due_1_color};
      }
      .details {
        font-size: ${cardConfig.details_size}
      }
      .emp {
        font-size: 130%;
      }
      .name {
        text-align: left;
        font-size: ${cardConfig.title_size}
      }
    `;
    this.content.innerHTML = `
      <table>
        <tbody id='attributes'>
        <tr>
          <td rowspan=2 class="tdicon" id="tdicon">
            <ha-icon-button icon="" class="">
            <ha-icon icon="" class="" id='ha_icon'></ha-icon>
            </ha-icon-button>
          </td>
          <td class="name"><span class="emp" id='friendly_name'></span></td>
        </tr>
        <tr>
          <td class='details' id='details'>
          </td>
        </tr>
        </tbody>
      </table>
    `;
    card.appendChild(style);
    card.appendChild(this.content);
    root.appendChild(card);
    this._config = cardConfig;
    this._firstLoad = false;
  }

  _ackGarbageOut() {
    this.myhass.callService('garbage_collection', 'collect_garbage', { entity_id: this._config.entity });
    this.style.display = "none";
  }

  _updateContent(attributes, hdate, hdays, hcard, duetxt, honclick, htitle, hicon, hdow, dowfmt, src) {
    const root = this.shadowRoot;
    var today = new Date()
    var todayYYYYMMDD = today.toISOString().split("T")[0];

    root.getElementById('ha_icon').icon = attributes.icon;
    root.getElementById('ha_icon').className = attributes.alerted;

    if (src === 'Garbage-Collection' && parseInt(attributes.days) < 2 && honclick) {
      root.getElementById('ha_card').addEventListener('click', this._ackGarbageOut.bind(this));
    }

    root.getElementById('friendly_name').innerHTML = attributes.friendly_name;

    if (parseInt(attributes.days) < 2) {
      if (duetxt === true) {
        root.getElementById('details').innerHTML = attributes.next_date;
      } else {
        root.getElementById('details').innerHTML = (hdate === false ? attributes.next_date : '') +
            (hdow === false ? ' ' + attributes.dow + (hdays === false ? ',' : '') : '' ) +
            (hdays === false ? ' ' + attributes.daysstr : '' )
      }
    } else {
      root.getElementById('details').innerHTML = (hdate === false ? attributes.next_date : '') +
            (hdow === false ? ' ' + attributes.dow + (hdays === false ? ',' : '') : '' ) +
            (hdays === false ? ' ' + attributes.daysstr : '' )
    }
    if ( hdays === true && hdate === true && duetxt === false && hdow === true ) {
      root.getElementById('details').style.display = "none";
    }

    if (hicon) {
      root.getElementById('tdicon').style.display = "none";
      root.getElementById('friendly_name').style.paddingLeft = "45px";
      root.getElementById('details').style.paddingLeft = "45px";
    }

    this.style.display = hcard ? "none" : "block";

    root.getElementById('friendly_name').style.display = htitle ? "none" : "block" ;

    if ( attributes.last_collection != null ) {
      if ( new Date(todayYYYYMMDD).getTime() === new Date(new Date(attributes.last_collection).toISOString().split("T")[0]).getTime() ) {
      // acknowledged today
        this.style.display = "none";
      } else {
        // acknowledged yesterday; 172800 = 60*60*24*2 (secs)
        if ( new Date(todayYYYYMMDD).getTime() - new Date(new Date(attributes.last_collection).toISOString().split("T")[0]).getTime() < 172800000 ) {
          if ( parseInt(attributes.days) < 1 ) {
            // acknowledged yesterday which was the day before the date of collection, so the collection is today
            this.style.display = "none";
          }
        }
      }
    }
  }

  _updateContentWithWarning(error) {
    const root = this.shadowRoot;
    root.getElementById('details').innerHTML = `<hui-warning>${error}</hui-warning>`;
  }

  set hass(hass) {
    const config = this._config;
    const root = this.shadowRoot;
    this.myhass = hass;

    let { hide_date, hide_days, hide_before, due_txt, hide_on_click, hide_icon, hide_title, hide_on_today, hide_dow, dow_format, source } = config;
    let hide_card = false;

    if (!this._firstLoad) {
      this._firstLoad = true;

      this.source = source;
      
      this.llocale = window.navigator.userLanguage || window.navigator.language;
      if (config.hass_lang_priority) {
        this.llocale = this.myhass.language;
      }
      this.translationJSONobj = null;

      var translationLocal = "/hacsfiles/garbage-collection-card/" + this.llocale.substring(0,2) + ".json";
      var rawFile = new XMLHttpRequest();
      rawFile.overrideMimeType("application/json");
      rawFile.open("GET", translationLocal, false);
      rawFile.send(null);
      if (rawFile.status == 200) {
        this.translationJSONobj = JSON.parse(rawFile.responseText);
      } else {
        // if no language file found, default to en
        translationLocal = "/hacsfiles/garbage-collection-card/en.json";
        rawFile.open("GET", translationLocal, false);
        rawFile.send(null);
        if (rawFile.status == 200) {
          this.translationJSONobj = JSON.parse(rawFile.responseText);
        }
      }
    }

    let attributes = this._getAttributes(hass, config.entity);

    if (hide_before > -1) {
      hide_card = attributes.days > hide_before;
    }

    if (attributes.days == 0) {
      hide_card = hide_on_today
    }

    this._stateObj = this._config.entity in hass.states ? hass.states[this._config.entity] : null;

    if (this._stateObj === null) {
      var entityNotFoundMessage = this._label('ui.panel.lovelace.warning.entity_not_found', 'Entity not found: {entity}');
      entityNotFoundMessage = entityNotFoundMessage.replace('{entity}', this._config.entity);
      this._updateContentWithWarning(entityNotFoundMessage);
      return;
    }

    if (isNaN(this._stateObj.state)) {
      hide_days = true;
      hide_date = false;
      attributes.next_date = this._stateObj.state;
    } else {
      if (attributes.days < 2) {
        if (typeof this.translationJSONobj != "undefined") {
          var dday = this._stateObj.state == 0 ? "today" : "tomorrow";
          if ( due_txt === true ) {
            if ( typeof this.translationJSONobj.other['due_today_order'] != "undefined" ) {
              if ( (/true/i).test(this.translationJSONobj.other['due_today_order']) ) {
                if ( typeof this.translationJSONobj.other['Due'] != "undefined" ) {
                  attributes.next_date = this.translationJSONobj.other['Due'] + " ";
                }
                if ( typeof this.translationJSONobj.state[dday] != "undefined" ) {
                  attributes.next_date += this.translationJSONobj.state[dday];
                }
              } else {
                var dday = this._stateObj.state == 0 ? "Today" : "Tomorrow";
                if ( typeof this.translationJSONobj.state[dday] != "undefined" ) {
                  attributes.next_date = this.translationJSONobj.state[dday] + " ";
                }
                if ( typeof this.translationJSONobj.other['due'] != "undefined" ) {
                  attributes.next_date += this.translationJSONobj.other['due'];
                }
              }
            }
          } else {
            if ( typeof this.translationJSONobj != "undefined"
              && typeof this.translationJSONobj.other['in_days'] !== "undefined" ) {
                attributes.daysstr = this.translationJSONobj.other['in_days'].replace('DAYS', attributes.days);
            } else {
              attributes.daysstr = `in ${attributes.days} days`;
            }
          }
        }
      } else { // attributes.days >= 2
        if ( typeof this.translationJSONobj != "undefined"
          && typeof this.translationJSONobj.other['in_days'] !== "undefined" ) {
            attributes.daysstr = this.translationJSONobj.other['in_days'].replace('DAYS', attributes.days);
        } else {
          attributes.daysstr = `in ${attributes.days} days`;
        }
      }
    }
    
    this._updateContent(attributes, hide_date, hide_days, hide_card, due_txt, hide_on_click, hide_title, hide_icon, hide_dow, dow_format, source);
  }

  getCardSize() {
    return 1;
  }
}

customElements.define('garbage-collection-card', GarbageCollectionCard);
