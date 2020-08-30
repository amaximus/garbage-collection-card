
class GarbageCollectionCard extends HTMLElement {

  constructor() {
    super();
    this.llocale = window.navigator.userLanguage || window.navigator.language;
    this.attachShadow({ mode: 'open' });
  }

  _label(label, fallback = 'unknown') {
    const lang = this.myhass.selectedLanguage || this.myhass.language;
    const resources = this.myhass.resources[lang];
    return (resources && resources[label] ? resources[label] : fallback);
  }

  _getAttributes(hass, filter1) {
    var next_date = '';
    var days = '';
    var friendly_name = '';
    var icon = '';
    var alerted = '';
    var last_collection = null;
    var routeobjarray = [];

    function _filterName(stateObj, pattern) {
      let parts;
      let attr_id;
      let attribute;

      if (typeof (pattern) === "object") {
        parts = pattern["key"].split(".");
        attribute = pattern["key"];
      } else {
        parts = pattern.split(".");
        attribute = pattern;
      }
      attr_id = parts[2];

      if (attr_id.indexOf('*') === -1) {
        return stateObj == attribute;
      }
      const regEx = new RegExp(`^${attribute.replace(/\*/g, '.*')}$`, 'i');
      return stateObj.search(regEx) === 0;
    }
 
    var filters1 = new Array();
    filters1[0] = {key: "sensor." + filter1 + ".next_date"};
    filters1[1] = {key: "sensor." + filter1 + ".days"};
    filters1[2] = {key: "sensor." + filter1 + ".friendly_name"};
    filters1[3] = {key: "sensor." + filter1 + ".icon"};
    filters1[4] = {key: "sensor." + filter1 + ".last_collection"};

    const attributes = new Map();
    filters1.forEach((filter) => {
      const filters = [];

      filters.push(stateObj => _filterName(stateObj, filter));

      Object.keys(hass.states).sort().forEach(key => {
        Object.keys(hass.states[key].attributes).sort().forEach(attr_key => {
          if (filters.every(filterFunc => filterFunc(`${key}.${attr_key}`))) {
            attributes.set(`${key}.${attr_key}`, {
              value: `${hass.states[key].attributes[attr_key]} ${filter.unit||''}`.trim(),
            });
          }  
        });
      });
    });

    var attr = Array.from(attributes.keys());
    attr.forEach(key => {
      var date_tmp;
      var date_option = { year: 'numeric', month: '2-digit', day: '2-digit'};
      var newkey = key.split('.')[2];

      switch (newkey) {
        case 'next_date':
          date_tmp = new Date(attributes.get(key).value);
          next_date = new Intl.DateTimeFormat(this.llocale, date_option).format(date_tmp);
          break;
        case 'days':
          days=attributes.get(key).value;
          break;
        case 'friendly_name':
          friendly_name=attributes.get(key).value;
          break;
        case 'icon':
          icon=attributes.get(key).value;
          break;
        case 'last_collection':
          if ( attributes.get(key).value != "null" ) {
            last_collection = attributes.get(key).value;
          }
          break;
        default:
          break;
      }
    });
    if ( days < 2 ) {
      alerted='alerted_1';
    }
    if ( days < 1 ) {
      alerted='alerted';
    }

    routeobjarray.push({
      friendly_name: friendly_name,
      next_date: next_date,
      days: days,
      icon: icon,
      alerted: alerted,
      last_collection: last_collection,
    });
    return Array.from(routeobjarray.values());
  }

  setConfig(config) {
    if (!config.entity) {
      throw new Error('Please define an entity');
    }
    config.filter

    const root = this.shadowRoot;
    if (root.lastChild) root.removeChild(root.lastChild);

    const cardConfig = Object.assign({}, config);

    const card = document.createElement('ha-card');
    this.content = document.createElement('div');
    const style = document.createElement('style');
    let icon_size = config.icon_size;
    if (typeof icon_size === "undefined") icon_size="25px"
    let icon_color = config.icon_color;
    if (typeof icon_color === "undefined") icon_color="black"
    let due_color = config.due_color;
    if (typeof due_color === "undefined") due_color="red"
    let due_1_color = config.due_1_color;
    if (typeof due_1_color === "undefined") due_1_color=due_color
    let details_size = config.details_size;
    if (typeof details_size === "undefined") details_size="14px"
    let title_size = config.title_size;
    if (typeof title_size === "undefined") title_size="17px"

    style.textContent = `
      table {
        width: 100%;
        margin-left: auto;
        margin-right: auto;
      }
      td {
        font-size: 120%;
        text-align: left;
      }
      .tdicon {
        padding-left: 35px;
        width: 60px;
      }
      ha-icon-button {
        color: ${icon_color};
        --mdc-icon-size: ${icon_size};
      }
      .alerted {
        color: ${due_color};
      }
      .alerted_1 {
        color: ${due_1_color};
      }
      .details {
        font-size: ${details_size}
      }
      .emp {
        font-size: 130%;
      }
      .name {
        text-align: left;
        font-size: ${title_size}
      }
    `;
    this.content.innerHTML = `
      <table>
        <tbody id='attributes'>
        <tr>
          <td rowspan=2 class="tdicon">
             <ha-icon-button icon="" class="" id='ha_icon'></ha-icon-button>
          </td>
          <td class="name"><span class="emp" id='friendly_name'></span></td>
        </tr>
        <tr>
          <td class='details' id="details">
          </td>
        </tr>
        </tbody>
      </table>
    `;
    card.appendChild(style);
    card.appendChild(this.content);
    root.appendChild(card)
    this._config = cardConfig;
  }

  _ackGarbageOut() {
    this.myhass.callService('garbage_collection', 'collect_garbage', { entity_id: this._config.entity });
    this.style.display = "none";
  }

  _updateContent(element, attributes, hdate, hdays, hcard) {
    const root = this.shadowRoot;
    var today = new Date()
    var date_option = { year: 'numeric', month: '2-digit', day: '2-digit'};
    //var today_date = new Intl.DateTimeFormat(this.llocale, date_option).format(today);
    var todayYYYYMMDD = today.toISOString().split("T")[0].replace(/-/g, ".");

    root.getElementById('ha_icon').icon = attributes[0].icon;
    root.getElementById('ha_icon').className = attributes[0].alerted;
    if ( parseInt(attributes[0].days) < 2 ) {
      root.getElementById('ha_icon').addEventListener('click', this._ackGarbageOut.bind(this));
    }

    root.getElementById('friendly_name').innerHTML = attributes[0].friendly_name;

    root.getElementById('details').innerHTML = (hdate === false ? attributes[0].next_date : '') +
            (hdays === false ? " " + this._label('ui.components.relative_time.future.In', 'in') +
                                " " + attributes[0].days + " " + this._label('ui.duration.days', 'days') : '' )

    this.style.display = hcard ? "none" : "block";

    if ( attributes[0].last_collection != null ) {
      if ( new Date(todayYYYYMMDD).getTime() === new Date(new Date(attributes[0].last_collection).toISOString().split("T")[0].replace(/-/g, ".")).getTime() ) {
      // acknowledged today
        this.style.display = "none";
      } else {
        // acknowledged yesterday; 172800 = 60*60*24*2 (secs)
        if ( new Date(todayYYYYMMDD).getTime() - new Date(new Date(attributes[0].last_collection).toISOString().split("T")[0].replace(/-/g, ".")).getTime() < 172800000 ) {
          if ( parseInt(attributes[0].days) < 1 ) {
            // acknowledged yesterday which was the day before the date of collection, so the collection is today
            this.style.display = "none";
          }
        }
      }
    }
  }

  set hass(hass) {
    const config = this._config;
    const root = this.shadowRoot;
    this.myhass = hass;

    let hide_date = false;
    if (typeof config.hide_date != "undefined") hide_date=config.hide_date
    let hide_days = false;
    if (typeof config.hide_days != "undefined") hide_days=config.hide_days
    let hide_card = false;
    let hide_before = -1;
    if (typeof config.hide_before != "undefined") hide_before=config.hide_before

    let attributes = this._getAttributes(hass, config.entity.split(".")[1]);
    if (hide_before>-1) {
      let iDays = parseInt(attributes[0].days,10);
      if (iDays > hide_before) {
        hide_card = true;
      }
    }

    this._stateObj = this._config.entity in hass.states ? hass.states[this._config.entity] : null;
    if ( isNaN(this._stateObj.state) ) {
      hide_days = true;
      hide_date = false;
      attributes[0].next_date = this._stateObj.state;
    } else {
      const translationLocal = "/hacsfiles/garbage-collection-card/" + hass.language.substring(0,2) + ".json";
      var rawFile = new XMLHttpRequest();
   // rawFile.responseType = 'json';
      rawFile.overrideMimeType("application/json");
      rawFile.open("GET", translationLocal, false);
      rawFile.send(null);
      if ( rawFile.status == 200 ) {
        if ( attributes[0].days < 2 ) {
          var translationJSONobj = JSON.parse(rawFile.responseText);
          if ( typeof translationJSONobj != "undefined" ) {
            var dday = this._stateObj.state == 0 ? "today":"tomorrow";
            if ( typeof translationJSONobj.state[dday] != "undefined" ) {
              attributes[0].next_date = translationJSONobj.state[dday];
            }
          }
        }
      }
    }

    this._updateContent(root.getElementById('attributes'), attributes, hide_date, hide_days, hide_card );
  }

  getCardSize() {
    return 1;
  }

}

customElements.define('garbage-collection-card', GarbageCollectionCard);
