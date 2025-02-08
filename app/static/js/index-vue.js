
const router = VueRouter.createRouter({
    history: VueRouter.createWebHashHistory(),
    routes: [
        {
            path: "/",
            component: {
                template: `
                    <div class="h-75 d-flex">
                        <div class="m-auto text-center">
                            <h1 class="mb-5 text-decoration-underline">E<small>VENTS</small> S<small>EARCH</small></h1>
                            <h3>Find any event in any city</h3>
                            <p class="mb-5"><strong>Search Query Format:</strong> <em>&lt;city&gt;</em><strong>, </strong><em>&lt;country&gt;</em></p>
                        </div>
                    </div>
                `,
            },
        },
        {
            path: "/events",
            component: {
                template: `
                    <div class="container-fluid p-5" style="max-width:var(--bs-breakpoint-lg);">
                        <h1 v-if="city_text" class="mb-5 text-center">Upcoming Events in {{city_text}}</h1>
                            
                        <div v-if="loading" class="text-center p-3 fs-4">Loading...</div>
                        <div v-if="error" class="text-center p-3 fs-4">{{error}}</div>
                        <div v-if='success' class="container-fluid">
                            <div v-if="events.length !== 0" class="d-flex justify-content-center mb-4">
                                <button class="btn btn-link p-0 icon-link icon-link-hover" :disabled="$route.query.page == 1 || page == 1" type="button" @click="prev_page"><span><i aria-hidden="true" class="bi bi-arrow-left me-1"></i>Prev</span></button>
                                <div class="col-auto mx-5 px-4">Page <strong>{{page}}</strong></div>
                                <button class="btn btn-link p-0 icon-link icon-link-hover" :disabled="end" type="button" @click="next_page"><span>Next<i aria-hidden="true" class="bi bi-arrow-right ms-1"></i></span></button>
                            </div>
                            <div v-if="events.length !== 0" class="container-md">
                                <div class="row row-cols-1 row-cols-sm-2 row-cols-lg-3 justify-content-center g-4">
                                    <div v-for="event in events" class="col">
                                        <div class="card h-100">
                                            <img class="card-img-top" :src="event.img" alt="event-img">
                                            <div class="card-body">
                                                <div v-if="event.urgency.text" class="mb-3">
                                                    <span style="font-size:14px;" :class="urgency_classlist(event.urgency.class)">{{ event.urgency.text }}</span>
                                                </div>
                                                <h5 class="card-title mb-3">{{ event.name }}</h5>
                                                <ul class="list-group mb-3">
                                                    <li class="list-group-item"><strong>Date:</strong> {{ event.date }}</li>
                                                    <li class="list-group-item"><strong>Location:</strong> {{ event.location }}</li>
                                                </ul>
                                            </div>
                                            <div class="card-footer text-end">
                                                <button type="button" class="btn btn-success stretched-link" title="Get Tickets" @click="open_modal(event)">Get Tickets</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div v-if="end" class="text-center"> --- end of events --- </div>
                            <div class="d-flex justify-content-center mt-5">
                                <button class="btn btn-link p-0 icon-link icon-link-hover" :disabled="$route.query.page == 1 || page == 1" type="button" @click="prev_page"><span><i aria-hidden="true" class="bi bi-arrow-left me-1"></i>Prev</span></button>
                                <div class="col-auto mx-5 px-4">Page <strong>{{page}}</strong></div>
                                <button class="btn btn-link p-0 icon-link icon-link-hover" :disabled="end" type="button" @click="next_page"><span>Next<i aria-hidden="true" class="bi bi-arrow-right ms-1"></i></span></button>
                            </div>
                        </div>

                        <div class="modal fade" tabindex="-1" ref="modal">
                            <div class="modal-dialog">
                                <div class="modal-content">
                                    <form @submit.prevent="get_tickets">
                                        <div class="modal-header border-bottom border-secondary bg-secondary-subtle">
                                            <h1 class="modal-title fs-5">Enter Email to Get Tickets</h1>
                                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                                        </div>
                                        <div class="modal-body text-center p-4">
                                            <div class="col-8 m-auto">
                                                <img class="img-fluid rounded border border-black mb-2" :src="modal.event.img" alt="event-img">

                                                <h5 class="mb-3"><strong>{{modal.event.name}}</strong></h5>
                                                
                                                <div class=""><strong>Date:</strong> {{ modal.event.date }}</div>
                                                <div class="mb-4"><strong>Location:</strong> {{ modal.event.location }}</div>

                                                <div class="form-floating">
                                                    <input type="email" v-model="modal.email" id="email" class="form-control border-secondary" placeholder="Enter your email" required>
                                                    <label for="email">Enter your email</label>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="modal-footer border-top border-secondary bg-secondary-subtle justify-content-center">
                                            <button type="submit" class="btn btn-success" :disabled="modal.form_submit">
                                                <span v-if="modal.form_submit" class="spinner-border spinner-border-sm me-2"></span>
                                                <span role="status">Get Tickets</span>
                                            </button>
                                            <button type="button" class="btn btn-secondary" @click="hide_modal">Close</button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                `,
                data() {
                    return {
                        loading: true,
                        error: "",
                        page: 0,
                        city_text: "",
                        end: false,
                        events: [],
                        modal: {
                            event: {},
                            email: "",
                            form_submit: false,
                        }
                    }
                },
                methods: {
                    urgency_classlist(cls) {
                        return `badge bg-${cls}-subtle text-${cls}-emphasis`;
                    },
                    fetch_data(query, page=1) {
                        this.loading = true;
                        this.error = "";

                        let q = new URLSearchParams({query: query.trim().toLowerCase(), page: page}).toString();
                        fetch(`/events?${q}`)
                        .then(response => response.json())
                        .then(data => {
                            if (data.error) {
                                this.error = data.error;
                            }
                            else {
                                this.page = data.page;
                                this.city_text = data.city_text;
                                this.events = data.events;
                                this.end = data.end;
                            }

                            this.loading = false;
                        })
                        .catch(error => {
                            alert("Caught Error");
                            console.error(error);
                        })
                    },
                    next_page() {
                        if (this.end) return;

                        const cur_page = parseInt(this.$route.query.page) ? parseInt(this.$route.query.page) : 1
                        this.$router.push({
                            path: "/events",
                            query: {
                                ...this.$route.query,
                                page: cur_page + 1,
                            },
                        });
                    },
                    prev_page() {
                        const cur_page = parseInt(this.$route.query.page) ? parseInt(this.$route.query.page) : 1
                        if (cur_page == 1) return;

                        this.$router.push({
                            path: "/events",
                            query: {
                                ...this.$route.query,
                                page: cur_page - 1,
                            },
                        });
                    },
                    open_modal(ev) {
                        this.modal.event = ev;
                        this.show_modal();
                    },
                    show_modal() {
                        const modal = new bootstrap.Modal(this.$refs.modal);
                        modal.show();
                    },
                    hide_modal() {
                        const modal = bootstrap.Modal.getInstance(this.$refs.modal) || new bootstrap.Modal(this.$refs.modal);
                        modal.hide();
                    },
                    get_tickets() {
                        if (this.modal.form_submit) return;
                        if (Object.keys(this.modal.event).length === 0) return;

                        this.modal.form_submit = true;

                        let email = this.modal.email;
                        if (!email) {
                            this.modal.form_submit = false;
                            alert("Email is required");
                            return;
                        }

                        let tag = this.modal.event.tag;

                        const form_data = new FormData();
                        form_data.append('email', email);
                        form_data.append('tag', tag);

                        fetch("/get_tickets", {
                            method: "POST",
                            body: form_data,
                        })
                        .then(response => response.json())
                        .then(data => {
                            if (data.error) {
                                this.modal.form_submit = false;
                                alert(data.error);
                            }
                            else if (data.success) {
                                this.hide_modal();

                                if (data.next) {
                                    window.open(data.next, target="_blank");
                                }
                                
                                this.modal.form_submit = false;
                            }
                        })
                        .catch(error => {
                            alert("Caught Error");
                            console.error(error);
                        });
                    }
                },
                computed: {
                    success() {
                        return (!this.loading && !this.error);
                    }
                },
                watch: {
                    "$route.query": {
                        handler(newVal, oldVal) {
                            let old_query = "";
                            if (oldVal) {
                                old_query = (oldVal.query ?? "").trim().toLowerCase();
                            }
                            
                            let new_query = (newVal.query ?? "").trim().toLowerCase();
                            
                            if (new_query !== old_query) {
                                this.city_text = "";
                                
                                if (new_query.length === 0) {
                                    alert("Query not given");
                                    this.$router.push("/");
                                    return;
                                }
                                if (new_query.split(",").length !== 2) {
                                    alert("Query must be of specified format");
                                    this.$router.push("/");
                                    return;
                                }
                            }

                            let new_page = parseInt(newVal.page) ? parseInt(newVal.page) : 1;

                            this.fetch_data(new_query, new_page);
                        },
                        deep: true,
                        immediate: true,
                    },
                },
                mounted() {
                    const modal = this.$refs.modal;
                    if (modal) {
                        modal.addEventListener("hide.bs.modal", () => {
                            this.modal.event = {};
                            this.modal.email = "";
                            this.modal.form_submit = false;
                        });
                    }
                },
            },
        },
    ]
});



Vue.createApp({
    template: `
        <div class="container-fluid p-0 h-100 overflow-auto">

            <div class="bg-body container-fluid px-5 py-3 sticky-top z-2 border-bottom border-tertiary border-2 shadow">
                <form class="mx-auto text-center col-12 col-sm-6" @submit.prevent="submit">
                    <div class="input-group mb-2">
                        <input v-model="city_query" list="cities" placeholder="Enter any City" class="form-control flex-fill border-secondary shadow-none" required>
                        <button type="submit" class="btn btn-primary">Search</button>
                    </div>
                    <button type="button" class="btn btn-link p-0" @click="clear_results">Clear Results</button>
                    <datalist id="cities">
                        <option v-for="city in cities" :value="city"/>
                    </datalist>
                </form>
            </div>

            <router-view></router-view>
        </div>
    `,
    data() {
        return {
            cities: [],
            city_query: "",
            timer: null,
        }
    },
    methods: {
        debounce(func, delay) {
            return function(...args) {
                clearTimeout(this.timer); 
                this.timer = setTimeout(() => func(...args), delay);
            };
        },
        get_cities(query_string) {
            fetch(`/cities?${query_string}`)
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    console.error(data.error);
                }
                else this.cities = data.cities;
            })
            .catch(error => {
                console.error(error);
            });
        },
        submit() {
            if (this.city_query.trim().length === 0) {
                alert("Enter a city");
                return;
            }
            
            if (this.city_query.trim().split(",").length !== 2) {
                alert("Query must be of specified format");
                return;
            }

            this.$router.push({
                path: "/events",
                query: {
                    query: this.city_query.trim().toLowerCase(),
                }
            });
        },
        clear_results() {
            this.city_query = "";
            this.cities = [];
            this.timer = null;

            this.$router.push("/");
        }
    },
    watch: {
        city_query(newVal, oldVal) {
            if (oldVal.length < newVal.length) {
                let query_string = new URLSearchParams({q: newVal.trim()}).toString();
                this.debounce(this.get_cities, 200)(query_string);
            }
            else if (oldVal.length > newVal.length) this.cities = [];
        },
        "$route.query": {
            deep: true,
            immediate: true,
            handler(newVal, oldVal) {
                let old_query = "";
                if (oldVal) {
                    old_query = (oldVal.query ?? "").trim().toLowerCase();
                }
                
                let new_query = (newVal.query ?? "").trim().toLowerCase();

                if (old_query !== new_query) {
                    if (new_query.length === 0) {
                        return;
                    }
                    if (new_query.split(",").length !== 2) {
                        return;
                    }

                    this.city_query = new_query.split(" ").map(x=>`${x[0].toUpperCase()}${x.slice(1)}`).join(" ");
                }
            }
        }
    },
})
.use(router)
.mount("#index-app");