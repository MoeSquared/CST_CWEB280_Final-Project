// apiService.js - enforces structure when calling api
import { useState, useEffect, useCallback } from "react";

/**
 * Function to make fetch requests of all Methods and allows FormData or JSON
 * Automatically sends token from local storage as a bearer token in the Authorization header
 * @param url api endpoint url can include query string
 * @param method default GET
 * @param dataToAPI can be FormData or JS object that is converted to JSON
 * @returns {Promise<any>}
 */
export async function fetchCallToAPI(url, method = "GET", dataToAPI = null) {
    const token = localStorage.getItem("token");
    const body = dataToAPI instanceof FormData ? dataToAPI : JSON.stringify(dataToAPI);

    const res = await fetch(url, {
        method: method.toUpperCase(),
        headers: {
            ...(dataToAPI instanceof FormData ? {} : { "Content-Type": "application/json" }),
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        ...(dataToAPI ? { body: body } : {}),
    });

    return await res.json();
}

/**
 * Custom hook that handles isLoading state, fetchError state and data returned from the api
 * @param url api endpoint url can include query string
 * @param method default GET
 * @param dataToAPI can be FormData or JS object that is converted to JSON
 * @param dataMapper function to transform the data
 * @returns {{isLoading: boolean, fetchError: unknown, dataFromAPI: unknown, fetchData: function}}
 */
export function useFetchAPI(url, method = "GET", dataToAPI = null, dataMapper = (d) => d) {
    const [isLoading, setIsLoading] = useState(false);
    const [fetchError, setFetchError] = useState(null);
    const [dataFromAPI, setDataFromAPI] = useState(null);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setFetchError(null);
        try {
            const result = await fetchCallToAPI(url, method, dataToAPI);
            // if result object has errors, set fetchError otherwise set return data
            result.error || result.detail
                ? setFetchError(result)
                : setDataFromAPI(dataMapper(result));
        } catch (err) {
            setFetchError({ error: err.message });
        } finally {
            setIsLoading(false);
        }
    }, [url, method, dataToAPI]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { isLoading, fetchError, dataFromAPI, fetchData };
}

/**
 * Custom hook for mutations (POST, PATCH, DELETE)
 * @param url base url for the mutation
 * @param method HTTP method (POST, PATCH, DELETE)
 * @returns {{isMutating: boolean, mutateError: unknown, dataFromAPI: unknown, mutate: function}}
 */
export function useMutateAPI(url, method = 'POST') {
    const [isMutating, setIsMutating] = useState(false);
    const [mutateError, setMutateError] = useState(null);
    const [dataFromAPI, setDataFromAPI] = useState(null);

    const mutate = useCallback(async (dataToAPI, param = "") => {
        setIsMutating(true);
        setMutateError(null);
        setDataFromAPI(null);
        try {
            const urlWithParam = param ? `${url.replace(/\/$/, '')}/${param}` : url;
            const result = await fetchCallToAPI(urlWithParam, method, dataToAPI);
            // if result object has errors, set mutateError otherwise set return data
            result.error || result.detail
                ? setMutateError(result)
                : setDataFromAPI(result);
            return result;
        } catch (err) {
            setMutateError({ error: err.message });
            return { error: err.message };
        } finally {
            setIsMutating(false);
        }
    }, [url, method]);

    return { isMutating, mutateError, dataFromAPI, mutate };
}