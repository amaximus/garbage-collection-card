
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
      var newkey = key.split('.')[2];

      switch (newkey) {
        case 'next_date':
          var date_tmp = new Date(attributes.get(key).value);
          var options = { year: 'numeric', month: '2-digit', day: '2-digit'};
          next_date = new Intl.DateTimeFormat(this.llocale, options).format(date_tmp);
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
    const content = document.createElement('div');
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
      ha-icon {
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
    content.innerHTML = `
      <table>
        <tbody id='attributes'>
        </tbody>
      </table>
    `;
    card.appendChild(style);
    card.appendChild(content);
    root.appendChild(card)
    this._config = cardConfig;
  }

  _updateContent(element, attributes, hdate, hdays, hcard) {
    element.innerHTML = `
      ${attributes.map((attribute) => `
        <tr>
          <td rowspan=2 class="tdicon"><ha-icon icon="${attribute.icon}" class="${attribute.alerted}"></td>
          <td class="name"><span class="emp">${attribute.friendly_name}</span></td>
        </tr>
        <tr>
          <td class="details">
            ${hdate === false ? `${attribute.next_date}` : ''}
            ${hdays === false ? " " + `${this._label('ui.components.relative_time.future.In', 'in')}` +
                                " " + `${attribute.days}` + " " + `${this._label('ui.duration.days', 'days')}` : '' }
          </td>
        </tr>
      `).join('')}
    `;

    this.style.display = hcard?"none":"block";
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

      const translationLocal = "/local/community/garbage-collection-card/" + hass.language + ".json";
      var rawFile = new XMLHttpRequest();
   // rawFile.responseType = 'json';
      rawFile.overrideMimeType("application/json");
      rawFile.open("GET", translationLocal, false);
      rawFile.send(null);
      if ( rawFile.status != 200 ) {
        attributes[0].next_date = this._stateObj.state;
      } else {
        if ( attributes[0].days > 1 ) {
          attributes[0].next_date = this._stateObj.state;
        } else {
          var translationJSONobj = JSON.parse(rawFile.responseText);
          if ( typeof translationJSONobj != "undefined" ) {
            if ( typeof translationJSONobj.state[this._stateObj.state] != "undefined" ) {
              attributes[0].next_date = translationJSONobj.state[this._stateObj.state];
            } else {
              attributes[0].next_date = this._stateObj.state;
            }
          } else {
            attributes[0].next_date = this._stateObj.state;
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
