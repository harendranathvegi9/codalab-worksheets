var AccountProfile = React.createClass({
  getInitialState: function() {
    return {
      user: null,
      errors: {}
    };
  },
  processData: function(response) {
    // Shim in links to change email and password
    var user = response.data;
    user.attributes.email = <span>{user.attributes.email} <a href="/account/changeemail">(change)</a></span>;
    user.attributes.password = <span>******** <a href="/rest/account/reset">(change)</a></span>;
    return user;
  },
  componentDidMount: function() {
    $.ajax({
      method: 'GET',
      url: '/rest/user',
      dataType: 'json',
      context: this
    }).done(function(response) {
      this.setState({
        user: this.processData(response)
      });
    }).fail(function(xhr, status, err) {
      this.setState({
        errors: xhr.responseText
      });
    });
  },
  handleChange: function(key, value) {
    // Clone and update locally
    var newUser = $.extend({}, this.state.user);
    newUser.attributes = {};
    newUser.attributes[key] = value;

    // Push changes to server
    $.ajax({
      method: 'PATCH',
      url: '/rest/user',
      data: JSON.stringify({data: newUser}),
      dataType: 'json',
      contentType: 'application/json',
      context: this,
      xhr: function() {
        // Hack for IE < 9 to use PATCH method
        return window.XMLHttpRequest == null || new window.XMLHttpRequest().addEventListener == null
          ? new window.ActiveXObject("Microsoft.XMLHTTP")
          : $.ajaxSettings.xhr();
      }
    }).done(function(response) {
      // Update state to reflect changed profile
      var errors = $.extend({}, this.state.errors);
      delete errors[key];
      this.setState({
        user: this.processData(response),
        errors: errors
      });
    }).fail(function(xhr, status, err) {
      // Update errors for the specified field to pick up
      console.log(xhr.responseText);
      var errors = $.extend({}, this.state.errors);
      errors[key] = xhr.responseText;
      this.setState({
        errors: errors
      });
    });
  },
  render: function() {
    if (!this.state.user) {
      return <div className="account-profile-error">{this.state.errors}</div>;
    }

    return <form className="account-profile-form">
      <AccountProfileField {...this.props} user={this.state.user} errors={this.state.errors} onChange={this.handleChange} title="Username" fieldKey="user_name" />
      <AccountProfileField {...this.props} user={this.state.user} errors={this.state.errors} onChange={this.handleChange} title="Email" fieldKey="email" readOnly />
      <AccountProfileField {...this.props} user={this.state.user} errors={this.state.errors} onChange={this.handleChange} title="Password" fieldKey="password" readOnly />
      <AccountProfileField {...this.props} user={this.state.user} errors={this.state.errors} onChange={this.handleChange} title="First Name" fieldKey="first_name" />
      <AccountProfileField {...this.props} user={this.state.user} errors={this.state.errors} onChange={this.handleChange} title="Last Name" fieldKey="last_name" />
      <AccountProfileField {...this.props} user={this.state.user} errors={this.state.errors} onChange={this.handleChange} title="Affiliation" fieldKey="affiliation" />
      <AccountProfileField {...this.props} user={this.state.user} errors={this.state.errors} onChange={this.handleChange} title="Website URL" fieldKey="url" />
      <AccountProfileField {...this.props} user={this.state.user} errors={this.state.errors} onChange={this.handleChange} title="Last Login (UTC)" fieldKey="last_login" readOnly />
      <AccountProfileField {...this.props} user={this.state.user} errors={this.state.errors} onChange={this.handleChange} title="Date Joined (UTC)" fieldKey="date_joined" readOnly />
      <AccountProfileField {...this.props} user={this.state.user} errors={this.state.errors} onChange={this.handleChange} title="Disk Quota (bytes)" fieldKey="disk_quota" readOnly />
      <AccountProfileField {...this.props} user={this.state.user} errors={this.state.errors} onChange={this.handleChange} title="Disk Used (bytes)" fieldKey="disk_used" readOnly />
      <AccountProfileField {...this.props} user={this.state.user} errors={this.state.errors} onChange={this.handleChange} title="Time Quota" fieldKey="time_quota" readOnly />
      <AccountProfileField {...this.props} user={this.state.user} errors={this.state.errors} onChange={this.handleChange} title="Time Used" fieldKey="time_used" readOnly />
    </form>;
  }
});


var AccountProfileField = React.createClass({
  propTypes: {
    onChange: React.PropTypes.func.isRequired,
    user: React.PropTypes.object.isRequired,
    title: React.PropTypes.string.isRequired,
    fieldKey: React.PropTypes.string.isRequired,
    readOnly: React.PropTypes.bool,
    writeOnly: React.PropTypes.bool
  },
  getDefaultProps: function() {
    return {
      readOnly: false,
      writeOnly: false
    };
  },
  getInitialState: function() {
    return {
      isUpdated: false
    };
  },
  componentWillReceiveProps: function(nextProps) {
    // isUpdated should be true after the first successful update of this field
    var justChanged = nextProps.user.attributes[this.props.fieldKey] !== this.props.user.attributes[this.props.fieldKey];
    this.setState({
      isUpdated: (this.state.isUpdated || justChanged)
    });
  },
  value: function(){
    return this.props.user.attributes[this.props.fieldKey];
  },
  error: function() {
    return this.props.errors[this.props.fieldKey];
  },
  handleKeyPress: function(event) {
    // Blur input on Enter, triggering onBlur
    if (event.charCode === 13) {
      $(event.target).blur();
    }
  },
  handleBlur: function(event) {
    // Submit the data on blur if changed, interpreting empty input as null
    var newValue = event.target.value || null;
    if (newValue !== this.value() || this.error()) {
      this.props.onChange(this.props.fieldKey, newValue);
    }
  },
  render: function() {
    var inputId = "account_profile_" + this.props.fieldKey;

    var fieldElement;
    if (this.props.readOnly) {
      // Read-only fields only need a simple div
      fieldElement = <div>{this.value()}</div>;
    } else {
      var formStateIcon;
      if (this.error()) {
        formStateIcon = <span>
          <span className="glyphicon glyphicon-remove" aria-hidden="true"></span>
          <span>&nbsp;Error</span>
        </span>
      } else if (this.state.isUpdated) {
        formStateIcon = <span>
          <span className="glyphicon glyphicon-ok" aria-hidden="true"></span>
          <span>&nbsp;Saved</span>
        </span>
      } else {
        formStateIcon = <span></span>;
      }

      fieldElement = <div className="row">
        <div className="col-sm-9">
          <input
            id={inputId}
            className="form-control"
            placeholder={this.props.title}
            defaultValue={this.value()}
            onBlur={this.handleBlur}
            onKeyPress={this.handleKeyPress}
          />
        </div>
        <div className="col-sm-3">
          {formStateIcon}
        </div>
      </div>;
    }

    return <div>
      <div className="form-group row">
        <label htmlFor={inputId} className="col-sm-3 form-control-label">
          {this.props.title}
        </label>
        <div className="col-sm-9">
          <div>{fieldElement}</div>
          <div className="account-profile-error">{this.error()}</div>
        </div>
      </div>
    </div>;
  }
});


React.render(<AccountProfile />, document.getElementById('account_profile_container'));
