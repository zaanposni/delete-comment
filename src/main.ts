import * as core from '@actions/core'
import * as github from '@actions/github'

async function run(): Promise<void> {
  console.log(
    `starting process for ${github.context.repo.owner}/${github.context.repo.repo}`
  )
  try {
    const token: string = core.getInput('github_token')
    const rawUserNames: string = core.getInput('delete_user_name')
    const userNames: string[] = rawUserNames.split(";")
    const bodyRegex: string = core.getInput('body_regex')
    const issueNumber: number = parseInt(core.getInput('issue_number'))
    const octokit = github.getOctokit(token)

    const deleteComments = async (issue: number): Promise<void> => {
      const resp = await octokit.rest.issues.listComments({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        issue_number: issue
      })

      console.log(`Found ${resp.data.length} total comments`)

      const comments = resp.data.filter(
        it => it.user?.login && userNames.includes(it.user.login) && it.body?.match(bodyRegex)
      )
      
      console.log(`Found ${comments.length} comments by users '${rawUserNames}'`)

      for (const comment of comments) {
        console.log(
          `Processing issue ${comment.issue_url} user: ${comment.user?.login} comment: ${comment.body}`
        )

        await octokit.request(
          'DELETE /repos/{owner}/{repo}/issues/comments/{comment_id}',
          {
            owner: github.context.repo.owner,
            repo: github.context.repo.repo,
            comment_id: comment.id
          }
        )
      }
    }

    await deleteComments(issueNumber)
  } catch (error) {
    console.error(error)
    if (error instanceof Error) {
      console.error(error.stack)
      core.setFailed(error.message)
    }
  }
}

void run()
