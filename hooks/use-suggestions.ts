import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useDebounce } from './use-debounce';

export function useSuggestions(query: string) {
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const debouncedQuery = useDebounce(query, 400);

    // Ref to track the prefix that returned no results
    const noResultsPrefixRef = useRef<string | null>(null);

    useEffect(() => {
        const fetchSuggestions = async () => {
            const trimmedQuery = debouncedQuery.trim();

            if (!trimmedQuery) {
                setSuggestions([]);
                return;
            }

            // Optimization: If current query starts with a prefix that returned no results, skip API call
            if (noResultsPrefixRef.current && trimmedQuery.toLowerCase().startsWith(noResultsPrefixRef.current.toLowerCase())) {
                return;
            }

            // If user backspaced or changed query such that it no longer matches the "no result" prefix, reset it
            if (noResultsPrefixRef.current && !trimmedQuery.toLowerCase().startsWith(noResultsPrefixRef.current.toLowerCase())) {
                noResultsPrefixRef.current = null;
            }

            setIsLoading(true);
            try {
                const res = await axios.post('/api/chat/suggest', {
                    query: trimmedQuery
                });

                // Ensure we have an array - API might return error object
                const newSuggestions = Array.isArray(res.data) ? res.data : [];
                setSuggestions(newSuggestions);

                if (newSuggestions.length === 0) {
                    // If no results, mark this query as a "dead end" prefix
                    noResultsPrefixRef.current = trimmedQuery;
                }

            } catch (error) {
                console.error("Error fetching suggestions:", error);
                setSuggestions([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSuggestions();
    }, [debouncedQuery]);

    return { suggestions, isLoading };
}
