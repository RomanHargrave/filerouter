import Resource from './Resource'
import UrlJoin from 'url-join'

/**
 * Repository API Response Model
 * (C) 2019 Roman Hargrave <roman@hargrave.info>
 */
export default class RepositoryProvider {

  constructor(params) {
    const { id, resource, rep } = params;
    this._id      = id;
    this.resource = resource;
    this._rep     = rep;
  }

  get id() {
    return this._id;
  }

  async reload() {
    this._rep = await this.resource.getRep(this.id);
  }

  get rep() {
    if (!this._rep) {
      this.reload();
    }

    return this._rep;
  }

  save() {
    throw "Providers may not be modified";
  }

  delete() {
    throw "Providers may not be modified";
  }

  get providerId() { return this.rep.id; }
  get name() { return this.rep.name; }
  get version() { return this.rep.version; }
  get features() { return this.rep.features; }
  get parameters() { return this.rep.parameters; }

  /**
   * Pass the configuration data to the repoesitory implementation for validation
   */
  async validateConfiguration(configuration) {
    return await this.resource.validateConfiguration(this.id, configuration);
  }

  /**
   * Get the JSForm document for this provider
   */
  async getForm() {
    return await this.resource.getForm(this.id);
  }
}

/**
 * Repository API Object
 * (C) 2019 Roman Hargrave <roman@hargrave.info>
 */
export class RepositoryProviderResource extends Resource {

  constructor(params) {
    super(params);
  }

  get resourcePath() { return "/providers/repositories"; }

  urlFor(id) {
    return UrlJoin(this.resourcePath, id);
  }


  get name() { return "RepositoryProvider"; }

  findRep(criteria, params) {
    return this.client.requestPaged({
      request: {
        url: this.resourcePath,
        params: Object.assign({ criteria: criteria }, params)
      }
    });
  }

  find(criteria, params) {
    const pagedRequest = this.findRep(criteria, params);
    pagedRequest.transform =
      (data) =>
        data.map((rep) =>
          new RepositoryProvider({
            id: rep.id,
            rep: rep,
            resource: this
          }));
    return pagedRequest;
  }

  async getRep(criteria, params) {
    const { id } = criteria;

    const result = await this.client.request({
      url: this.urlFor(id),
      params: params || {}
    });

    return result.data;
  }

  get(criteria) {
    const { id } = criteria;
    return new RepositoryProvider({
      id: id,
      resource: this,
      client: this.client
    });
  }

  async createOrUpdate(rep) { throw "Providers may not be modified"; }
  async delete(rep) { throw "Providers may not be modified"; }

  /**
   * Pass the configuration data to the repoesitory implementation for validation
   */
  async validateConfiguration(id, configuration) {
    const validationEndpoint = UrlJoin(this.urlFor(id), 'validate');

    const response = await this.client.request({
      url: validationEndpoint,
      method: 'post',
      data: configuration
    });

    return response.data;
  }

  /**
   * Get the JSForm configuration document for the provider with `id`
   */
  async getForm(id) {
    const formEndpoint = UrlJoin(this.urlFor(id), 'form');

    const response = await this.client.request({url: formEndpoint});

    return response.data;
  }
}
