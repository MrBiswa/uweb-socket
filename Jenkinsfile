def getEnvName() {
    if (env.BRANCH_NAME == 'main') {
        return 'production'
    }
    else if (env.BRANCH_NAME == 'staging') {
        return 'staging'
    }
    else if (env.BRANCH_NAME == 'development') {
        return 'development'
    }
}

pipeline {
  agent {
  kubernetes {
    cloud 'kubernetes'
    inheritFrom 'cicd-v2'
    }
  }
  environment {
    serviceName = 'central-socket'
    envName = getEnvName()
  }
  stages{
        stage('Run CI?') {
            when {
                expression { env.envName == 'production' }
            }
            steps {
                script {
                if (sh(script: "git log -1 --pretty=%B | fgrep -ie '[skip ci]' -e '[ci skip]'", returnStatus: true) == 0) {
                    currentBuild.result = 'NOT_BUILT'
                    error 'Aborting because commit message contains [skip ci]'
                    }
                }
            }
        }
        stage('Starting-CICD') {
            steps {
                script {
                    if (env.envName == 'production') {
                    build wait: false, job: "/${env.envName}/${env.serviceName}", parameters: [string(name: 'ServiceName', value: "${env.serviceName}"), string(name: 'RepoUrl', value: "${GIT_URL}"), booleanParam(name: 'SemVerFlag', value: true)]
                } else {
                    build wait: false, job: "/${env.envName}/${env.serviceName}", parameters: [string(name: 'ServiceName', value: "${env.serviceName}"), string(name: 'RepoUrl', value: "${GIT_URL}")]
                }    
                
                }
                
            }
        }
    }
}
