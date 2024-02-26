import axios from 'axios'
import lodash from 'lodash'
import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import config from '../config.json' assert { type: "json" }

const pascalCase = (str: string) => {
  return lodash.upperFirst(lodash.camelCase(str));
};

const updateEntries = async () => {
  const client = axios.create({
    baseURL: config.directusUrl,
    headers: {
      Authorization: `Bearer ${config.directusApiKey}`,
    },
  });

  const {data: {data: tiers}} = await client.get('items/tracking_tiers')
  const tier0 = tiers.find((tier: { tier: number, id: string }) => tier.tier === 0)
  const tier1 = tiers.find((tier: { tier: number, id: string }) => tier.tier === 1)

  const filter = {
    _or: [
      {
        tier: {
          _eq: tier0.id
        }
      },
      {
        tier: {
          _eq: tier1.id
        }
      }
    ]
  }

  const {data: {data: events}} = await client.get('items/tracking_events', {
    params: { filter }
  })

  const {data: {data: contexts}} = await client.get('items/tracking_contexts', {
    params: { filter }
  })

  const eventNames = events.map((event: {name: string}) => lodash.camelCase(event.name))
  const contextsNames = contexts.map((context: {name: string}) => pascalCase(context.name))

  await writeFile(path.resolve(path.dirname('')) + '/topTierEntries.json', JSON.stringify(eventNames.concat(contextsNames), undefined, '\t'))
}

updateEntries()