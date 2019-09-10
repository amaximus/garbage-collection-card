class GarbageCollectionCard extends HTMLElement {

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  version() { return "0.2.0"; }

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
          next_date=attributes.get(key).value.split('T')[0];
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
      }
    });
    if ( days < 2 ) {
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
      iron-icon {
        --iron-icon-height: ${icon_size};
        --iron-icon-width: ${icon_size};
        --iron-icon-fill-color: ${icon_color};
      }
      .alerted {
        --iron-icon-fill-color: ${due_color};
      }
      .emp {
        font-size: 130%;
      }
      .name {
        text-align: left;
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

  _updateContent(element, attributes, hdate, hdays) {
    element.innerHTML = `
      ${attributes.map((attribute) => `
        <tr>
          <td rowspan=2 class="tdicon"><iron-icon icon="${attribute.icon}" class="${attribute.alerted}"></td>
          <td class="name"><span class="emp">${attribute.friendly_name}</span></td>
        </tr>
        <tr>
          <td>
            ${hdate === false ? `${attribute.next_date}` : ''}
            ${hdays === false ? " " + `${this._label('ui.components.relative_time.future.In', 'in')}` +
                                " " + `${attribute.days}` + " " + `${this._label('ui.duration.days', 'days')}` : '' }
          </td>
        </tr>
      `).join('')}
    `;
  }

  set hass(hass) {
    const config = this._config;
    const root = this.shadowRoot;
    this.myhass = hass;

    let hide_date = false;
    if (typeof config.hide_date != "undefined") hide_date=config.hide_date
    let hide_days = false;
    if (typeof config.hide_days != "undefined") hide_days=config.hide_days

    let attributes = this._getAttributes(hass, config.entity.split(".")[1]);

    this._updateContent(root.getElementById('attributes'), attributes, hide_date, hide_days );
  }

  getCardSize() {
    return 1;
  }
}

customElements.define('garbage-collection-card', GarbageCollectionCard);
