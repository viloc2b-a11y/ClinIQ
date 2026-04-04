# Features

Place **feature modules** here using a consistent pattern, for example:

```
features/
  visits/
    components/
    actions/
    hooks/
    index.ts          # optional public API for the feature
```

Routes in `app/` should compose feature exports rather than grow monolithic pages.
