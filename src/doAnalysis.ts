import { getInput, info, setFailed } from "@actions/core";
import { context, getOctokit } from "@actions/github";
import { readFile } from "node:fs";
import { join } from 'node:path';
import config from '../config.json'
import topTierEntries from '../topTierEntries.json';

const doAnalysis = async () => {
  try {
    const changedFilesString = getInput("changedFiles");
    const changedFiles = changedFilesString.split(" ");

    const analyseFilePromises: Promise<{fileName: string, hasTopTierEvent: boolean}>[] = changedFiles.map((fileName) => {
      return new Promise((resolve) => {
        readFile(join(process.env.GITHUB_WORKSPACE!, fileName), 'utf8', (err, fileString) => {
          if (err || !fileString) {
            resolve({fileName, hasTopTierEvent: false})
            return
          }
          for (const event of topTierEntries) {
            if (fileString.includes(event)) {
              resolve({fileName, hasTopTierEvent: false})
              return
            }
          }
          resolve({fileName, hasTopTierEvent: false})
        });
      })
    })

    const analyzedFiles = await Promise.all(analyseFilePromises)
    const editedEventsFiles = analyzedFiles.filter(({hasTopTierEvent}) => hasTopTierEvent === true)
    if (!editedEventsFiles.length) {
      info('--------------------------------------- No top tier event files edits were found. ---------------------------------------')
      return true
    }

    info('--------------------------------------- These are the edited files containing top tier events/contexts ---------------------------------------')
    info(editedEventsFiles.map(({fileName}) => fileName).join('\n'))
  
    const payload = context.payload;
    const client = getOctokit(getInput("token"));
  
    const {data: reviewsResponses} = await client.request('GET /repos/{owner}/{repo}/pulls/{pull_number}/reviews', {
      owner: payload.repository!.owner.login,
      repo: payload.repository!.name,
      pull_number: payload.number,
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    })

    const existingReview = reviewsResponses.find(({user}) => user!.login === config.reviewerUsername)
    if (!existingReview) {
      await client.request('POST /repos/{owner}/{repo}/pulls/{pull_number}/requested_reviewers', {
        owner: payload.repository!.owner.login,
        repo: payload.repository!.name,
        pull_number: payload.number,
        reviewers: [config.reviewerUsername],
        headers: {
          'X-GitHub-Api-Version': '2022-11-28'
        }
      })
    }
  } catch (error) {
    if (error instanceof Error) setFailed(error.message);
    throw error
  }
}

doAnalysis()