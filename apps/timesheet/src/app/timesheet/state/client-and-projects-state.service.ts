import { BehaviorSubject, Observable } from "rxjs";
import { distinctUntilChanged, map } from "rxjs/operators";

import { BaseStateService } from "./base-state.service";
import { Client } from "../../models/client";
import { ClientAndProjectService } from "../services/client-and-project.service";
import { Injectable } from "@angular/core";
import { Project } from "../../models/project";

export interface ClientAndProjectState {
    collection: Client[],
    selectedClient: string | null,
    selectedProject: string | null
    isClientDisabled: boolean
    isProjectDisabled: boolean
    isDatesDisabled: boolean
}

const initialState = {
    collection: [],
    selectedClient: null,
    selectedProject: null,
    isClientDisabled: false,
    isProjectDisabled: false,
    isDatesDisabled: false
} as ClientAndProjectState

@Injectable({
    providedIn: 'root'
})
export class ClientAndProjectStateService extends BaseStateService<ClientAndProjectState> {

    public readonly $clients = this._select<Client[]>((state: ClientAndProjectState) => {
        return state.collection;
    })

    public readonly $projects = this._select<Project[]>((state: ClientAndProjectState) => {
        let projects: Project[] = []
        state.collection.forEach(client => {
            if (state.selectedClient === null || state.selectedClient === client.id) {
                projects = [
                    ...projects,
                    ...client.projects
                ]
            }
        });
        return projects;
    })

    public readonly $selectedClient = this._select<string | null>((state: ClientAndProjectState) => {
        return state.selectedClient;
    })

    public readonly $selectedProject = this._select<string | null>((state: ClientAndProjectState) => {
        return state.selectedProject;
    })

    public readonly $disableClient = this._select<boolean>((state: ClientAndProjectState) => {
        return state.isClientDisabled;
    })

    public readonly $disableProject = this._select<boolean>((state: ClientAndProjectState) => {
        return state.isProjectDisabled;
    })

    public readonly $disableDate = this._select<boolean>((state: ClientAndProjectState) => {
        return state.isDatesDisabled;
    })

    protected load(): void {
        let state = {} as Partial<ClientAndProjectState>;
        this._clientAndProjectService.get()
            .subscribe((response: Client[]) => {
                state = {
                    ...state,
                    collection: response
                }
                if (state.collection?.length === 1) {
                    const projects = state.collection[0].projects;
                    state = {
                        ...state,
                        selectedClient: state.collection[0].id,
                        isClientDisabled: true
                    }
                    if (projects.length === 1) {
                        state = {
                            ...state,
                            selectedProject: projects[0].id,
                            isProjectDisabled: true
                        }
                    }
                }
                this.State = state;
            });
    }

    constructor(
        private readonly _clientAndProjectService: ClientAndProjectService
    ) {
        super(initialState);
        this.load();
    }

    public reset(): void {
        let state = {
            collection: this.State.collection,
            selectedClient: null,
            selectedProject: null,
            isClientDisabled: false,
            isProjectDisabled: false
        } as Partial<ClientAndProjectState>;
        if (state.collection?.length === 1) {
            const projects = state.collection[0].projects;
            state = {
                ...state,
                selectedClient: state.collection[0].id,
                isClientDisabled: true
            }
            if (projects.length === 1) {
                state = {
                    ...state,
                    selectedProject: projects[0].id,
                    isProjectDisabled: true
                }
            }
        }
        this.State = state;
    }

    private _findClientById(id: string): Client {
        const state = this.State;
        const client = state.collection.find(client => client.id === id);
        if(!client || client?.projects.length === 0)
        return {} as Client;
        else  return client;
    }

    private _findClientByProjectId(id: string): Client | null {
        const state = this.State;
        let project: Project | null = null;

        for (let i = 0; i < state.collection.length; i++) {
            for (let j = 0; j < state.collection[i].projects.length; j++) {
                if (state.collection[i].projects[j].id === id) {
                    project = state.collection[i].projects[j];
                    break;
                }
            }
            if (project !== null) {
                return state.collection[i];
            }
        }
        return null;
    }

    private _findProjectFromClientById(client: Client | null, id: string): Project | null {
        let projects = client?.projects;

        if(!projects){
            return null;
        }

        projects = projects.filter(project => project.id === id);
        if(projects.length > 0) {
            return projects[0];
        }
        else {
            return null;
        }
    }

    public set Client(id: string | null) {
        let state = {} as Partial<ClientAndProjectState>;
        if (id !== null) {
            const client = this._findClientById(id);
            state = {
                ...state,
                selectedClient: id,
                selectedProject: null,
                isProjectDisabled: false
            };
            if (client.projects?.length === 1) {
                state = {
                    ...state,
                    selectedProject: client.projects[0].id,
                    isProjectDisabled: true
                };
            }
            this.State = state;
        }
    }

    public get Client(): string | null {
        return this.State.selectedClient;
    }

    public set Project(id: string | null) {
        let state = {} as Partial<ClientAndProjectState>;
        if (id !== null) {
            const client = this._findClientByProjectId(id);
            const project = this._findProjectFromClientById(client, id);
            this.State = {
                selectedClient: client?.id,
                selectedProject: project?.id
            }
        }
    }

    public get Project(): string | null {
        return this.State.selectedProject;
    }

    public disable() {
        this.State = {
            isClientDisabled: true,
            isProjectDisabled: true,
            isDatesDisabled: true
        }
    }

    public getProjectById(id: string): Project | null {
        const client = this._findClientByProjectId(id);
        if(!client){
            return null;
        }

        const project = this._findProjectFromClientById(client, id);

        return project;
    }
}
