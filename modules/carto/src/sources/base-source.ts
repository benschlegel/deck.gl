import {encodeParameter, MapType, REQUEST_TYPES} from '../api/maps-api-common';
import {APIErrorContext} from '../api/carto-api-error';
import {
  CartoSourceOptionalOptions,
  CartoSourceRequiredOptions,
  CartoTilejsonResult,
  GeojsonResult,
  SOURCE_DEFAULTS,
  Tilejson,
  TilejsonMapInstantiation
} from './common';
import {buildApiEndpoint, requestWithParameters} from './utils';

export async function CartoBaseSource<UrlParameters extends Record<string, string>>(
  endpoint: MapType,
  options: Partial<CartoSourceOptionalOptions> & CartoSourceRequiredOptions,
  urlParameters: UrlParameters
): Promise<any> {
  // TODO return type: Promise<GeojsonResult | CartoTilejsonResult>
  const mergedOptions = {...SOURCE_DEFAULTS, ...options, endpoint};
  const baseUrl = buildApiEndpoint(mergedOptions);
  const {accessToken, format} = mergedOptions;
  const headers = {Authorization: `Bearer ${options.accessToken}`, ...options.headers};

  const errorContext: APIErrorContext = {
    requestType: REQUEST_TYPES.INSTANTIATION,
    connection: options.connectionName,
    type: endpoint,
    source: JSON.stringify(urlParameters, undefined, 2)
  };
  const mapInstantiation = await requestWithParameters<TilejsonMapInstantiation>({
    baseUrl,
    parameters: urlParameters,
    headers,
    errorContext
  });

  const dataUrl = mapInstantiation[format].url[0];
  errorContext.requestType = REQUEST_TYPES.DATA;

  if (format === 'tilejson') {
    const tilejson = await requestWithParameters<Tilejson>({
      baseUrl: dataUrl,
      headers,
      errorContext
    });
    return {...tilejson, accessToken};
  } else {
    return await requestWithParameters<GeojsonResult>({
      baseUrl: dataUrl,
      headers,
      errorContext
    });
  }
}
