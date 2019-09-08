class GarbageCollectionCard extends HTMLElement {

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  version() { return "0.2.0"; }

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

    style.textContent = `
      table {
        width: 70%;
        margin-left: auto;
        margin-right: auto;
      }
      td {
        font-size: 120%;
        text-align: center;
      }
      .alerted {
        color: #cc0000;
      }
      iron-icon {
        --iron-icon-height: ${icon_size};
        --iron-icon-width: ${icon_size};
      }
      .emp {
        font-size: 130%;
        text-align: left;
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

  _updateContent(element, attributes) {
    element.innerHTML = `
      ${attributes.map((attribute) => `
        <tr>
          <td><iron-icon icon="${attribute.icon}" class="${attribute.alerted}"></td>
          <td class="name"><span class="emp">${attribute.friendly_name}</span></td>
        </tr>
        <tr>
          <td colspan=2>on ${attribute.next_date}, in ${attribute.days} days</td>
        </tr>
      `).join('')}
    `;
  }

  set hass(hass) {
    const config = this._config;
    const root = this.shadowRoot;

    let attributes = this._getAttributes(hass, config.entity.split(".")[1]);

    this._updateContent(root.getElementById('attributes'), attributes );
  }

  getCardSize() {
    return 1;
  }
}

customElements.define('garbage-collection-card', GarbageCollectionCard);
